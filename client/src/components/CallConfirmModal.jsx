import React from 'react';

const CallConfirmModal = ({ callerId, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-lg max-w-sm w-full text-center">
                <h2 className="text-xl font-semibold mb-4">Call Request</h2>
                <p className="mb-6">{callerId} wants to call. Allow?</p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Allow
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Deny
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CallConfirmModal;
