import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPaymentHistory } from '../store/slices/feeSlice';
import { TableSkeleton } from '../components/Skeletons';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiDownload } from 'react-icons/fi';

const PaymentHistoryPage = () => {
  const dispatch = useDispatch();
  const { history, loading } = useSelector((state) => state.fee);

  useEffect(() => { dispatch(fetchPaymentHistory()); }, [dispatch]);

  const downloadReceipt = async (feePaymentId) => {
    try {
      const res = await api.get(`/receipts/${feePaymentId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'receipt.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch { toast.error('Receipt not available yet'); }
  };

  const statusStyle = (s) => ({
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    initiated: 'bg-gray-100 text-gray-600',
  }[s] || 'bg-gray-100 text-gray-600');

  return (
    <div className="space-y-5">
      <h1 className="text-xl sm:text-2xl font-bold">Payment History</h1>

      {loading ? <TableSkeleton /> : (
        <>
         
          <div className="card hidden sm:block">
            <div className="table-wrap">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Fee Head</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Transaction ID</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {history?.map((t) => (
                    <tr key={t._id}>
                      <td className="py-3 text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="py-3">{t.feePaymentId?.feeHead || '—'}</td>
                      <td className="py-3 font-semibold">₹{t.amount.toLocaleString()}</td>
                      <td className="py-3 font-mono text-xs text-gray-400 max-w-[120px] truncate">{t.gatewayReference}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyle(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {t.status === 'success' && t.feePaymentId?._id && (
                          <button onClick={() => downloadReceipt(t.feePaymentId._id)} className="text-primary-600 hover:underline flex items-center gap-1 text-xs">
                            <FiDownload size={13} /> PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!history?.length && (
                    <tr><td colSpan={6} className="py-10 text-center text-gray-400">No transactions yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

         
          <div className="sm:hidden space-y-3">
            {history?.map((t) => (
              <div key={t._id} className="card space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{t.feePaymentId?.feeHead || 'Payment'}</p>
                    <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyle(t.status)}`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-lg font-bold text-primary-700 dark:text-primary-300">₹{t.amount.toLocaleString()}</p>
                <p className="font-mono text-xs text-gray-400 truncate">{t.gatewayReference}</p>
                {t.status === 'success' && t.feePaymentId?._id && (
                  <button onClick={() => downloadReceipt(t.feePaymentId._id)} className="text-primary-600 flex items-center gap-1 text-sm">
                    <FiDownload size={14} /> Download Receipt
                  </button>
                )}
              </div>
            ))}
            {!history?.length && (
              <div className="card text-center text-gray-400 py-10">No transactions yet.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentHistoryPage;