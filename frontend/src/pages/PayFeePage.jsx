import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  fetchStudentFees,
  initiatePayment,
  verifyPayment,
  initiateBulkPayment,
  verifyBulkPayment,
} from '../store/slices/feeSlice';
import { FiCheckCircle, FiCreditCard, FiZap } from 'react-icons/fi';

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

  // 'full' | 'individual'
  const [mode, setMode] = useState('full');
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);

  // Semester filter — payment happens per semester only
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    if (user?.id) dispatch(fetchStudentFees(user.id));
  }, [dispatch, user]);

  // Semesters derived straight from the student's fee heads
  const availableSemesters = useMemo(() => {
    if (!feeHeads?.length) return [];
    return [...new Set(feeHeads.map((f) => f.semester))].sort((a, b) => a - b);
  }, [feeHeads]);

  // Auto-select the first semester once fee heads load
  useEffect(() => {
    if (availableSemesters.length > 0 && !availableSemesters.includes(Number(selectedSemester))) {
      setSelectedSemester(String(availableSemesters[0]));
    }
  }, [availableSemesters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Only this semester's fee heads from here on
  const semesterFeeHeads = useMemo(() => {
    if (!feeHeads || !selectedSemester) return [];
    return feeHeads.filter((f) => String(f.semester) === String(selectedSemester));
  }, [feeHeads, selectedSemester]);

  const pendingHeads = semesterFeeHeads.filter((f) => f.status !== 'paid');
  const totalPending = pendingHeads.reduce((s, f) => s + (f.amountDue - f.amountPaid), 0);

 const buildMethodConfig = () => ({
  netbanking: method === 'netbanking',
  card: method === 'card',
  wallet: method === 'wallet',
  upi: method === 'upi',
  paylater: false,
  emi: false,
});

  const openIndividual = (head) => {
    setMode('individual');
    setSelected(head);
    setAmount(String(head.amountDue - head.amountPaid));
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

  // Pay ALL pending fee heads of the SELECTED SEMESTER together
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

  // Pay a single fee head (partial or full)
  const paySingle = async () => {
    if (!selected) return;
    const amt = Number(amount);
    const balance = selected.amountDue - selected.amountPaid;
    if (amt <= 0 || amt > balance) {
      return toast.error(`Enter an amount between ₹1 and ₹${balance}`);
    }
    setProcessing(true);
    const ok = await openRazorpay(selected._id, amt);
    if (ok) {
      dispatch(fetchStudentFees(user.id));
      setSelected(null);
      setMode('individual');
    }
    setProcessing(false);
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
              setSelected(null);
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

      {/* ── Mode Toggle ── */}
      <div className="card">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Choose how you want to pay:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Pay All at Once */}
          <button
            onClick={() => { setMode('full'); setSelected(null); setAmount(String(totalPending)); }}
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

          {/* Pay One by One */}
          <button
            onClick={() => { setMode('individual'); setSelected(null); }}
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
              <p className="text-xs text-gray-500 mt-0.5">Select a fee head, pay full or partial</p>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left – fee head list (this semester only) */}
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
              const balance = f.amountDue - f.amountPaid;
              const isPaid = f.status === 'paid';
              const isSelected = selected?._id === f._id;

              return (
                <button
                  key={f._id}
                  disabled={isPaid || mode === 'full'}
                  onClick={() => mode === 'individual' && !isPaid && openIndividual(f)}
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
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isPaid && (
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                          ₹{balance.toLocaleString()} due
                        </span>
                      )}
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

        {/* Right – payment panel */}
        <div className="card h-fit space-y-4">
          <h2 className="font-semibold">
            {mode === 'full' ? `Pay Semester ${selectedSemester} Dues` : selected ? `Pay – ${selected.feeHead}` : 'Select a Fee Head'}
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

          {mode === 'individual' && !selected && (
            <p className="text-sm text-gray-400 text-center py-4">
              ← Select a fee head from the list
            </p>
          )}

          {mode === 'individual' && selected && (
            <>
              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Due</span>
                  <span>₹{selected.amountDue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Already Paid</span>
                  <span className="text-green-600">₹{selected.amountPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold border-t dark:border-gray-600 pt-1 mt-1">
                  <span>Balance</span>
                  <span className="text-red-500">₹{(selected.amountDue - selected.amountPaid).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">Amount to Pay (₹)</label>
                  <button
                    onClick={() => setAmount(String(selected.amountDue - selected.amountPaid))}
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
                  max={selected.amountDue - selected.amountPaid}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  You can pay partially — the remaining balance carries forward.
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
        </div>
      </div>
    </div>
  );
};

export default PayFeePage;