'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useRegister, useRegisterAndFund, useUserProfile } from '@/lib/contracts/hooks';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/config';
import FantasyCoreABI from '@/lib/abis/FantasyCore.json';
import MockUSDCABI from '@/lib/abis/MockUSDC.json';
import { parseUnits } from 'viem';
import { useWriteContract, useReadContract } from 'wagmi';

export default function RegisterPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { data: userProfile } = useUserProfile(address);
  const { writeContract: register, isPending: isRegistering } = useWriteContract();
  const { writeContract: registerAndFund, isPending: isFunding } = useWriteContract();
  const { writeContract: approve, isPending: isApproving } = useWriteContract();
  
  const [fundAmount, setFundAmount] = useState('');
  const [step, setStep] = useState<'register' | 'fund'>('register');

  const isRegistered = userProfile && userProfile[0] !== '0x0000000000000000000000000000000000000000';

  const handleRegisterOnly = async () => {
    try {
      await register({
        address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
        abi: FantasyCoreABI,
        functionName: 'register',
      });
      toast.success('Registration successful!');
      router.push('/profile');
    } catch (error) {
      toast.error('Registration failed');
      console.error(error);
    }
  };

  const handleRegisterAndFund = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const usdcAmount = parseUnits(fundAmount, 6); // USDC has 6 decimals
      const minChipsOut = (usdcAmount * 99n) / 100n; // 1% slippage

      // First approve USDC
      await approve({
        address: CONTRACT_ADDRESSES.mockUSDC as `0x${string}`,
        abi: MockUSDCABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.fantasyCore, usdcAmount],
      });

      // Then register and fund
      await registerAndFund({
        address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
        abi: FantasyCoreABI,
        functionName: 'registerAndFund',
        args: [usdcAmount, minChipsOut],
      });

      toast.success('Registration and funding successful!');
      router.push('/profile');
    } catch (error) {
      toast.error('Registration and funding failed');
      console.error(error);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Register</h1>
        <p className="text-gray-600">Please connect your wallet to register</p>
      </div>
    );
  }

  if (isRegistered) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Already Registered</h1>
        <p className="text-gray-600 mb-8">You&apos;re already registered on the platform!</p>
        <button
          onClick={() => router.push('/profile')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Go to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Register Your Account</h1>
      
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Choose Registration Option</h2>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Option 1: Register Only</h3>
              <p className="text-gray-600 mb-4">
                Create your account now and add funds later
              </p>
              <button
                onClick={handleRegisterOnly}
                disabled={isRegistering}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isRegistering ? 'Registering...' : 'Register Now'}
              </button>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Option 2: Register & Fund</h3>
              <p className="text-gray-600 mb-4">
                Create your account and add USDC to get chips immediately
              </p>
              <div className="flex gap-2 mb-4">
                <input
                  type="number"
                  placeholder="USDC Amount"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="flex-1 p-2 border rounded"
                  min="0"
                  step="0.01"
                />
                <span className="flex items-center px-3 text-gray-600">USDC</span>
              </div>
              <button
                onClick={handleRegisterAndFund}
                disabled={isFunding || isApproving || !fundAmount}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
              >
                {isApproving ? 'Approving...' : isFunding ? 'Processing...' : 'Register & Fund'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-2">What happens next?</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Your profile will be created on the blockchain</li>
            <li>You can buy chips to start trading players</li>
            <li>Build your squad and earn points each gameweek</li>
            <li>Claim chips based on your players&apos; performance</li>
            <li>Redeem chips for USDC at the end of the season</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
