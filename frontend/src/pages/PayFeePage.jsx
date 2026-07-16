import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../api/axios';
import {
  fetchStudentFees,
  initiatePayment,
  verifyPayment,
  initiateBulkPayment,
  verifyBulkPayment,
} from '../store/slices/feeSlice';
import { FiCheckCircle, FiCreditCard, FiZap, FiFileText } from 'react-icons/fi';

const METHODS = [
  { id: 'upi', label: '📱 UPI' },
  { id: 'card', label: '💳 Card' },
  { id: 'netbanking', label: '🏦 Net Banking' },
  { id: 'wallet', label: '👛 Wallet' },
];

const PayFeePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { feeHeads, summary, loading } = useSelector((state) => state.fee);

  const [mode, setMode] = useState('full');
  const [selectedMultiple, setSelectedMultiple] = useState([]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    if (user?.id) dispatch(fetchStudentFees(user.id));
  }, [dispatch, user]);
  const availableSemesters = useMemo(() => {
    if (!feeHeads?.length) return [];
    return [...new Set(feeHeads.map((f) => f.semester))].sort((a, b) => a - b);
  }, [feeHeads]);
  useEffect(() => {
    if (availableSemesters.length > 0 && !availableSemesters.includes(Number(selectedSemester))) {
      setSelectedSemester(String(availableSemesters[0]));
    }
  }, [availableSemesters]); 
  const semesterFeeHeads = useMemo(() => {
    if (!feeHeads || !selectedSemester) return [];
    return feeHeads.filter((f) => String(f.semester) === String(selectedSemester));
  }, [feeHeads, selectedSemester]);

  const pendingHeads = semesterFeeHeads.filter((f) => f.status !== 'paid');

  const getBalance = (f) => Math.max(f.amountDue - f.amountPaid - (f.scholarshipApplied || 0), 0);
  const totalPending = pendingHeads.reduce((s, f) => s + getBalance(f), 0);

 const buildMethodConfig = () => ({
  netbanking: method === 'netbanking',
  card: method === 'card',
  wallet: method === 'wallet',
  upi: method === 'upi',
  paylater: false,
  emi: false,
});

  const toggleHead = (head) => {
    setMode('individual');
    setSelectedMultiple((prev) => {
      const isSelected = prev.some((h) => h._id === head._id);
      const next = isSelected ? prev.filter((h) => h._id !== head._id) : [...prev, head];
      const total = next.reduce((s, f) => s + getBalance(f), 0);
      setAmount(next.length > 0 ? String(total) : '');
      return next;
    });
  };

  const openRazorpay = async (feePaymentId, payAmount) => {
    if (!window.Razorpay) {
      toast.error('Payment gateway not loaded. Please refresh the page.');
      return;
    }

    const initRes = await dispatch(initiatePayment({ feePaymentId, amount: payAmount, paymentMethod: method }));
    if (!initiatePayment.fulfilled.match(initRes)) return;

    const { order, razorpayKeyId } = initRes.payload;

    return new Promise((resolve) => {
      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'SmartFee Portal',
        description: 'Fee Payment',
        order_id: order.id,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#2563eb' },
        method: buildMethodConfig(),
        handler: async (response) => {
          const verifyRes = await dispatch(
            verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              feePaymentId,
            })
          );
          resolve(verifyPayment.fulfilled.match(verifyRes));
        },
        modal: { ondismiss: () => resolve(false) },
      });
      rzp.open();
    });
  };

  const downloadChallan = async (feePaymentId) => {
  try {
    const res = await api.get(`/fees/${feePaymentId}/challan`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fee-challan.pdf';
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    toast.error('Failed to generate challan');
  }
};

  const payFullFee = async () => {
    if (pendingHeads.length === 0) return;
    if (totalPending <= 0) return toast.error('No pending fees to pay');

    if (!window.Razorpay) {
      toast.error('Payment gateway not loaded. Please refresh the page.');
      return;
    }

    setProcessing(true);
    const feePaymentIds = pendingHeads.map((h) => h._id);

    const initRes = await dispatch(initiateBulkPayment({ feePaymentIds, paymentMethod: method }));
    if (!initiateBulkPayment.fulfilled.match(initRes)) {
      setProcessing(false);
      return;
    }

    const { order, razorpayKeyId } = initRes.payload;

    const rzp = new window.Razorpay({
      key: razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      name: 'SmartFee Portal',
      description: `Semester ${selectedSemester} Fee Payment – ${pendingHeads.length} fee head(s)`,
      order_id: order.id,
      prefill: { name: user?.name, email: user?.email },
      theme: { color: '#2563eb' },
      method: buildMethodConfig(),
      handler: async (response) => {
        const verifyRes = await dispatch(
          verifyBulkPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            feePaymentIds,
          })
        );
        if (verifyBulkPayment.fulfilled.match(verifyRes)) {
          dispatch(fetchStudentFees(user.id));
          setMode('full');
        }
        setProcessing(false);
      },
      modal: { ondismiss: () => setProcessing(false) },
    });
    rzp.open();
  };

  const paySingle = async () => {
    const selected = selectedMultiple[0];
    if (!selected) return;
    const amt = Number(amount);
    const balance = getBalance(selected);
    if (amt <= 0 || amt > balance) {
      return toast.error(`Enter an amount between ₹1 and ₹${balance}`);
    }
    setProcessing(true);
    const ok = await openRazorpay(selected._id, amt);
    if (ok) {
      dispatch(fetchStudentFees(user.id));
      setSelectedMultiple([]);
      setMode('individual');
    }
    setProcessing(false);
  };

  const paySelected = async () => {
    if (selectedMultiple.length < 2) return;
    const total = selectedMultiple.reduce((s, f) => s + getBalance(f), 0);
    const amt = Number(amount);
    if (amt <= 0 || amt > total) {
      return toast.error(`Enter an amount between ₹1 and ₹${total}`);
    }

    if (!window.Razorpay) {
      toast.error('Payment gateway not loaded. Please refresh the page.');
      return;
    }

    setProcessing(true);
    const feePaymentIds = selectedMultiple.map((h) => h._id);

    const initRes = await dispatch(initiateBulkPayment({ feePaymentIds, paymentMethod: method, amount: amt }));
    if (!initiateBulkPayment.fulfilled.match(initRes)) {
      setProcessing(false);
      return;
    }

    const { order, razorpayKeyId } = initRes.payload;

    const rzp = new window.Razorpay({
      key: razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      name: 'SmartFee Portal',
      description: `${selectedMultiple.length} selected fee head(s) – Semester ${selectedSemester}`,
      order_id: order.id,
      prefill: { name: user?.name, email: user?.email },
      theme: { color: '#2563eb' },
      method: buildMethodConfig(),
      handler: async (response) => {
        const verifyRes = await dispatch(
          verifyBulkPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            feePaymentIds,
          })
        );
        if (verifyBulkPayment.fulfilled.match(verifyRes)) {
          dispatch(fetchStudentFees(user.id));
          setSelectedMultiple([]);
          setAmount('');
        }
        setProcessing(false);
      },
      modal: { ondismiss: () => setProcessing(false) },
    });
    rzp.open();
  };

  const statusBadge = (s) => ({
    paid: 'bg-green-100 text-green-700',
    partial: 'bg-amber-100 text-amber-700',
    pending: 'bg-red-100 text-red-700',
  }[s] || 'bg-gray-100 text-gray-600');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Pay Fee</h1>

        {availableSemesters.length > 0 && (
          <select
            value={selectedSemester}
            onChange={(e) => {
              setSelectedSemester(e.target.value);
              setSelectedMultiple([]);
              setMode('full');
            }}
            className="input-field text-sm py-2 px-3 w-auto"
          >
            {availableSemesters.map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="card">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Choose how you want to pay:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => { setMode('full'); setSelectedMultiple([]); setAmount(String(totalPending)); }}
            className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
              mode === 'full'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
            }`}
          >
            <div className={`mt-0.5 p-2 rounded-xl ${mode === 'full' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
              <FiZap size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Pay Full Fee at Once</p>
              <p className="text-xs text-gray-500 mt-0.5">Clear all pending dues for this semester</p>
              {totalPending > 0 && (
                <p className="text-primary-600 dark:text-primary-400 font-bold text-base mt-1.5">
                  ₹{totalPending.toLocaleString()}
                </p>
              )}
            </div>
          </button>
          <button
            onClick={() => { setMode('individual'); setSelectedMultiple([]); }}
            className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
              mode === 'individual'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
            }`}
          >
            <div className={`mt-0.5 p-2 rounded-xl ${mode === 'individual' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
              <FiCreditCard size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Pay Individually</p>
              <p className="text-xs text-gray-500 mt-0.5">Check one or more fee heads to pay — full or partial for a single head</p>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="card text-sm text-gray-500">Loading fee details...</div>
          ) : semesterFeeHeads.length === 0 ? (
            <div className="card text-center py-10">
              <FiCheckCircle className="text-green-500 mx-auto mb-2" size={36} />
              <p className="font-semibold text-green-600">No fee heads for this semester</p>
            </div>
          ) : pendingHeads.length === 0 ? (
            <div className="card text-center py-10">
              <FiCheckCircle className="text-green-500 mx-auto mb-2" size={36} />
              <p className="font-semibold text-green-600">All fees paid for this semester! 🎉</p>
            </div>
          ) : (
            semesterFeeHeads.map((f) => {
              const balance = getBalance(f);
              const isPaid = f.status === 'paid';
              const isSelected = selectedMultiple.some((h) => h._id === f._id);

              return (
                <button
                  key={f._id}
                  disabled={isPaid || mode === 'full'}
                  onClick={() => mode === 'individual' && !isPaid && toggleHead(f)}
                  className={`w-full text-left card transition-all ${
                    isPaid
                      ? 'opacity-60 cursor-not-allowed'
                      : mode === 'individual' && !isPaid
                      ? isSelected
                        ? 'ring-2 ring-primary-500 bg-primary-50/50 dark:bg-primary-900/20 cursor-pointer'
                        : 'cursor-pointer hover:ring-2 hover:ring-primary-300'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        isPaid ? 'bg-green-500' : f.status === 'partial' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-semibold text-sm">{f.feeHead}</p>
                        <p className="text-xs text-gray-500">
                          Due: ₹{f.amountDue.toLocaleString()}
                          {f.amountPaid > 0 && ` · Paid: ₹${f.amountPaid.toLocaleString()}`}
                          {f.scholarshipApplied > 0 && ` · Scholarship: -₹${f.scholarshipApplied.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                   <div className="flex items-center gap-2">
          {!isPaid && (
           <span className="text-sm font-bold text-red-600 dark:text-red-400">
              ₹{balance.toLocaleString()} due
            </span>
          )}
          {!isPaid && (
            <button onClick={(e) => { e.stopPropagation(); downloadChallan(f._id); }}
              className="text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1">
            <FiFileText size={12} /> Challan
            </button>)}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(f.status)}`}>
            {f.status}
          </span>
            </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
        <div className="card h-fit space-y-4">
          <h2 className="font-semibold">
            {mode === 'full'
              ? `Pay Semester ${selectedSemester} Dues`
              : selectedMultiple.length === 1
              ? `Pay – ${selectedMultiple[0].feeHead}`
              : selectedMultiple.length > 1
              ? `Pay – ${selectedMultiple.length} Fee Heads`
              : 'Select Fee Head(s)'}
          </h2>

          {mode === 'full' && pendingHeads.length > 0 && (
            <>
              <div className="bg-primary-50 dark:bg-primary-900/30 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Total Amount</p>
                <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                  ₹{totalPending.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{pendingHeads.length} fee head(s) · Semester {selectedSemester}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`text-xs px-2 py-2 rounded-xl border transition-all ${
                        method === m.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 font-semibold text-primary-700 dark:text-primary-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={payFullFee}
                disabled={processing || totalPending === 0}
                className="btn-primary w-full py-3 text-base font-semibold"
              >
                {processing ? 'Processing...' : `Pay ₹${totalPending.toLocaleString()}`}
              </button>
              <p className="text-xs text-gray-400 text-center">
                Powered by Razorpay · Secured payment
              </p>
            </>
          )}

          {mode === 'individual' && selectedMultiple.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              ← Check one or more fee heads from the list
            </p>
          )}

          {mode === 'individual' && selectedMultiple.length === 1 && (
            <>
              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Due</span>
                  <span>₹{selectedMultiple[0].amountDue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Already Paid</span>
                  <span className="text-green-600">₹{selectedMultiple[0].amountPaid.toLocaleString()}</span>
                </div>
                {selectedMultiple[0].scholarshipApplied > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Scholarship Credit</span>
                    <span className="text-green-600">-₹{selectedMultiple[0].scholarshipApplied.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t dark:border-gray-600 pt-1 mt-1">
                  <span>Balance</span>
                  <span className="text-red-500">₹{getBalance(selectedMultiple[0]).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">Amount to Pay (₹)</label>
                  <button
                    onClick={() => setAmount(String(getBalance(selectedMultiple[0])))}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Pay full balance
                  </button>
                </div>
                <input
                  type="number"
                  className="input-field"
                  value={amount}
                  min={1}
                  max={getBalance(selectedMultiple[0])}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  You can pay partially — the remaining balance carries forward. Check another fee head to combine payments.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`text-xs px-2 py-2 rounded-xl border transition-all ${
                        method === m.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 font-semibold text-primary-700 dark:text-primary-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={paySingle}
                disabled={processing || !amount}
                className="btn-primary w-full py-3 text-base font-semibold"
              >
                {processing ? 'Processing...' : `Pay ₹${Number(amount || 0).toLocaleString()}`}
              </button>
              <p className="text-xs text-gray-400 text-center">
                Powered by Razorpay · Secured payment
              </p>
            </>
          )}

          {mode === 'individual' && selectedMultiple.length > 1 && (
            <>
              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 text-sm space-y-1">
                {selectedMultiple.map((f) => (
                  <div key={f._id} className="flex justify-between">
                    <span className="text-gray-500">{f.feeHead}</span>
                    <span>₹{getBalance(f).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t dark:border-gray-600 pt-1 mt-1">
                  <span>Combined Balance</span>
                  <span className="text-red-500">
                    ₹{selectedMultiple.reduce((s, f) => s + getBalance(f), 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">Amount to Pay (₹)</label>
                  <button
                    onClick={() => setAmount(String(selectedMultiple.reduce((s, f) => s + getBalance(f), 0)))}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Pay full balance
                  </button>
                </div>
                <input
                  type="number"
                  className="input-field"
                  value={amount}
                  min={1}
                  max={selectedMultiple.reduce((s, f) => s + getBalance(f), 0)}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Paying less than the combined balance fills{' '}
                  <strong>{selectedMultiple[0]?.feeHead}</strong> first, then the next checked head, in the
                  order you selected them — any remaining balance carries forward.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`text-xs px-2 py-2 rounded-xl border transition-all ${
                        method === m.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 font-semibold text-primary-700 dark:text-primary-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={paySelected}
                disabled={processing || !amount}
                className="btn-primary w-full py-3 text-base font-semibold"
              >
                {processing ? 'Processing...' : `Pay ₹${Number(amount || 0).toLocaleString()}`}
              </button>
              <p className="text-xs text-gray-400 text-center">
                Powered by Razorpay · Secured payment
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayFeePage;