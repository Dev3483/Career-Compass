import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function OTPInput({ onComplete, loading }) {
    const [otp, setOtp] = useState(['', '', '', '']);
    const inputs = useRef([]);

    useEffect(() => {
        // Auto-focus first box on mount
        if (inputs.current[0]) {
            inputs.current[0].focus();
        }
    }, []);

    const handleChange = (value, index) => {
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Move focus forward
        if (value && index < 3) {
            inputs.current[index + 1].focus();
        }

        // Auto-submit if all 4 are filled
        if (newOtp.every(digit => digit !== '') && !loading) {
            onComplete(newOtp.join(''));
        }
    };

    const handleKeyDown = (e, index) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').slice(0, 4);
        if (/^\d+$/.test(data)) {
            const newOtp = data.split('');
            setOtp(newOtp);
            if (newOtp.length === 4) {
                onComplete(data);
            }
        }
    };

    return (
        <div className="flex justify-center gap-4">
            {otp.map((digit, index) => (
                <motion.div
                    key={index}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <input
                        ref={el => inputs.current[index] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(e.target.value, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onPaste={handlePaste}
                        disabled={loading}
                        className={`w-14 h-16 text-center text-3xl font-bold rounded-2xl border-2 transition-all outline-none
                            ${digit ? 'border-[#6C63FF] bg-purple-50 text-[#6C63FF]' : 'border-gray-200 focus:border-[#6C63FF] bg-white'}
                            ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300'}
                        `}
                    />
                </motion.div>
            ))}
        </div>
    );
}
