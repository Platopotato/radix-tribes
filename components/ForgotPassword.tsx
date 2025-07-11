
import React, { useState } from 'react';
import * as api from '../lib/api';
import Card from './ui/Card';
import Button from './ui/Button';

interface ForgotPasswordProps {
  onSuccess: () => void;
  onCancel: () => void;
}

type RecoveryStep = 'enter_username' | 'answer_question' | 'reset_password';

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState<RecoveryStep>('enter_username');
  const [username, setUsername] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { question } = await api.getSecurityQuestion(username);
      setSecurityQuestion(question);
      setStep('answer_question');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Username not found.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await api.verifySecurityAnswer(username, securityAnswer);
      setStep('reset_password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect answer.');
    } finally {
        setIsLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    setIsLoading(true);
    try {
      await api.resetPassword(username, newPassword);
      setSuccess('Password reset successfully! You will be redirected to the login page.');
      setTimeout(onSuccess, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  const renderStep = () => {
    if (success) {
        return <p className="text-green-400 text-center">{success}</p>
    }
    switch (step) {
      case 'enter_username':
        return (
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-center text-amber-400">Find Your Account</h2>
            <div>
              <label htmlFor="username-forgot" className="block text-sm font-medium text-slate-300 mb-1">Username</label>
              <input type="text" id="username-forgot" value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-slate-200" disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Searching...' : 'Find Account'}</Button>
          </form>
        );
      case 'answer_question':
        return (
          <form onSubmit={handleAnswerSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-center text-amber-400">Security Question</h2>
            <p className="text-slate-400 text-sm">For user: <span className="font-bold">{username}</span></p>
            <div>
              <p className="block text-sm font-medium text-slate-300 mb-1">{securityQuestion}</p>
              <input type="password" value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-slate-200" disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Verifying...' : 'Verify'}</Button>
          </form>
        );
      case 'reset_password':
        return (
          <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-center text-amber-400">Reset Your Password</h2>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-slate-200" disabled={isLoading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-slate-200" disabled={isLoading}/>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Resetting...' : 'Reset Password'}</Button>
          </form>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-900">
      <Card title="Password Recovery" className="max-w-sm w-full">
        <div className="space-y-4">
          {renderStep()}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
           {!success && (
                <p className="text-sm text-center text-slate-400 pt-4 border-t border-slate-700">
                    Remember your password?{' '}
                    <button type="button" onClick={onCancel} className="font-medium text-amber-500 hover:text-amber-400">
                    Back to Login
                    </button>
                </p>
           )}
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;