'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  getUserDetails,
  getMutualFunds,
  getFIRequestUser,
  getFIRequestAccount,
  getFIPs,
  getBrokers,
  getNPSLinkedAccounts,
  getAccountConsents,
  getTermDepositLinkedAccounts,
  getTermDepositUserDetails,
  getTermDepositAccountStatement,
  getRecurringDepositLinkedAccounts,
  getRecurringDepositUserDetails,
  getRecurringDepositAccountStatement,
  getMFUserLinkedAccounts,
  getMFHoldingFolio,
  getMFUserDetails,
  getMFAccountStatement,
  getMFInsights,
  getMFAnalysis,
  getMFCConsentRequest,
  getMFCConsentApprove,
  getETFUserLinkedAccounts,
  getETFInsights,
  getEquitiesUserLinkedAccounts,
  getEquitiesHoldingBroker,
  getEquitiesDematHolding,
  getEquitiesBrokerHolding,
  getEquitiesUserDetails,
  getEquitiesETFsDematHolding,
  getDepositUserDetails,
  getDepositAccountStatementDownload,
  getDepositInsights,
  delinkAccount,
  initiateConsentPlus,
  submitConsentV1,
} from './actions';
import FinancialDataDisplay from './components/FinancialDataDisplay';
import DataTable from './components/DataTable';
import Tabs from './components/Tabs';
import SubTabs from './components/SubTabs';
import NPSLinkedAccountsDisplay from './components/NPSLinkedAccountsDisplay';
import MutualFundsDisplay from './components/MutualFundsDisplay';
import FIPsDisplay from './components/FIPsDisplay';
import BrokersDisplay from './components/BrokersDisplay';
import { camelToTitleCase, formatValue, flattenObject } from '@/lib/formatters';

type TabId = 'portfolio' | 'mutualfunds' | 'termdeposit' | 'rddeposit' | 'mfdetails' | 'etf' | 'equities' | 'deposit' | 'firequest' | 'fips' | 'brokers' | 'nps' | 'consents';
type SubTabId = string;

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('portfolio');
  const [activeSubTab, setActiveSubTab] = useState<Record<TabId, SubTabId>>({
    portfolio: '',
    mutualfunds: '',
    termdeposit: 'linked',
    rddeposit: 'linked',
    mfdetails: 'linked',
    etf: 'linked',
    equities: 'linked',
    deposit: 'details',
    firequest: '',
    fips: '',
    brokers: '',
    nps: '',
    consents: '',
  });

  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<Record<string, any>>({});
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [consentV1Data, setConsentV1Data] = useState<any>(null);

  useEffect(() => {
    loadUserDetails();
  }, []);

  const loadData = async (key: string, loader: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      const result = await loader();
      setData(prev => ({ ...prev, [key]: result }));
      if (!result) toast.error(`No data available for ${key}`);
    } catch (error) {
      toast.error(`Error loading ${key}`);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const loadUserDetails = () => loadData('userDetails', getUserDetails);

  useEffect(() => {
    const key = `${activeTab}-${activeSubTab[activeTab]}`;
    if (data[key] !== undefined || loading[key]) return;

    switch (activeTab) {
      case 'mutualfunds':
        if (!data.mutualfunds) loadData('mutualfunds', getMutualFunds);
        break;
      case 'termdeposit':
        switch (activeSubTab.termdeposit) {
          case 'linked':
            loadData('td-linked', getTermDepositLinkedAccounts);
            break;
          case 'details':
            loadData('td-details', getTermDepositUserDetails);
            break;
          case 'statement':
            loadData('td-statement', getTermDepositAccountStatement);
            break;
        }
        break;
      case 'rddeposit':
        switch (activeSubTab.rddeposit) {
          case 'linked':
            loadData('rd-linked', getRecurringDepositLinkedAccounts);
            break;
          case 'details':
            loadData('rd-details', getRecurringDepositUserDetails);
            break;
          case 'statement':
            loadData('rd-statement', getRecurringDepositAccountStatement);
            break;
        }
        break;
      case 'mfdetails':
        switch (activeSubTab.mfdetails) {
          case 'linked':
            loadData('mf-linked', getMFUserLinkedAccounts);
            break;
          case 'folio':
            loadData('mf-folio', getMFHoldingFolio);
            break;
          case 'details':
            loadData('mf-details', getMFUserDetails);
            break;
          case 'statement':
            loadData('mf-statement', getMFAccountStatement);
            break;
          case 'insights':
            loadData('mf-insights', getMFInsights);
            break;
          case 'analysis':
            loadData('mf-analysis', getMFAnalysis);
            break;
          case 'consent':
            loadData('mf-consent', getMFCConsentRequest);
            break;
          case 'approve':
            loadData('mf-approve', getMFCConsentApprove);
            break;
        }
        break;
      case 'etf':
        switch (activeSubTab.etf) {
          case 'linked':
            loadData('etf-linked', getETFUserLinkedAccounts);
            break;
          case 'insights':
            loadData('etf-insights', getETFInsights);
            break;
        }
        break;
      case 'equities':
        switch (activeSubTab.equities) {
          case 'linked':
            loadData('eq-linked', getEquitiesUserLinkedAccounts);
            break;
          case 'holding-broker':
            loadData('eq-holding-broker', getEquitiesHoldingBroker);
            break;
          case 'demat':
            loadData('eq-demat', getEquitiesDematHolding);
            break;
          case 'broker':
            loadData('eq-broker', getEquitiesBrokerHolding);
            break;
          case 'details':
            loadData('eq-details', getEquitiesUserDetails);
            break;
          case 'combined':
            loadData('eq-etf-combined', getEquitiesETFsDematHolding);
            break;
        }
        break;
      case 'deposit':
        switch (activeSubTab.deposit) {
          case 'details':
            loadData('dep-details', getDepositUserDetails);
            break;
          case 'statement':
            loadData('dep-statement', getDepositAccountStatementDownload);
            break;
          case 'insights':
            loadData('dep-insights', getDepositInsights);
            break;
        }
        break;
      case 'firequest':
        if (!data.firequest) {
          Promise.all([
            loadData('fi-user', getFIRequestUser),
            loadData('fi-account', getFIRequestAccount),
          ]);
        }
        break;
      case 'fips':
        if (!data.fips) loadData('fips', getFIPs);
        break;
      case 'brokers':
        if (!data.brokers) loadData('brokers', getBrokers);
        break;
      case 'nps':
        if (!data.nps) loadData('nps', getNPSLinkedAccounts);
        break;
      case 'consents':
        if (!data.consents) loadData('consents', getAccountConsents);
        break;
    }
  }, [activeTab, activeSubTab]);

  const handleDelinkAccount = async () => {
    setActionLoading('delink');
    try {
      const result = await delinkAccount();
      if (result.success) {
        toast.success('Account delinked successfully!');
        loadUserDetails();
      } else {
        toast.error(result.message || 'Failed to delink account');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error delinking account');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConnectBank = async () => {
    setActionLoading('connect');
    try {
      const url = await initiateConsentPlus();
      toast.success('Redirecting to bank connection...');
      setTimeout(() => {
        window.location.href = url;
      }, 500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to initiate consent');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDirectConsent = async () => {
    setActionLoading('consent');
    setConsentV1Data(null);
    try {
      const result = await submitConsentV1();
      setConsentV1Data(result);
      toast.success('Consent submitted successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit consent');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { id: 'portfolio' as TabId, label: 'Portfolio', icon: '💼' },
    { id: 'deposit' as TabId, label: 'Deposits', icon: '🏦' },
    { id: 'mutualfunds' as TabId, label: 'MF List', icon: '🎯' },
    { id: 'mfdetails' as TabId, label: 'MF Details', icon: '📊' },
    { id: 'equities' as TabId, label: 'Equities', icon: '📈' },
    { id: 'etf' as TabId, label: 'ETF', icon: '💎' },
    { id: 'termdeposit' as TabId, label: 'Term Deposit', icon: '💰' },
    { id: 'rddeposit' as TabId, label: 'RD', icon: '📈' },
    { id: 'firequest' as TabId, label: 'FI Requests', icon: '📋' },
    { id: 'fips' as TabId, label: 'FIPs', icon: '🏢' },
    { id: 'brokers' as TabId, label: 'Brokers', icon: '💹' },
    { id: 'nps' as TabId, label: 'NPS', icon: '🛡️' },
    { id: 'consents' as TabId, label: 'Consents', icon: '✅' },
  ];

  const subTabs = {
    deposit: [
      { id: 'details', label: 'User Details', icon: '👤' },
      { id: 'statement', label: 'Statement', icon: '📄' },
      { id: 'insights', label: 'Insights', icon: '💡' },
    ],
    termdeposit: [
      { id: 'linked', label: 'Linked Accounts', icon: '🔗' },
      { id: 'details', label: 'User Details', icon: '👤' },
      { id: 'statement', label: 'Statement', icon: '📄' },
    ],
    rddeposit: [
      { id: 'linked', label: 'Linked Accounts', icon: '🔗' },
      { id: 'details', label: 'User Details', icon: '👤' },
      { id: 'statement', label: 'Statement', icon: '📄' },
    ],
    mfdetails: [
      { id: 'linked', label: 'Linked Accounts', icon: '🔗' },
      { id: 'folio', label: 'Holding Folio', icon: '📁' },
      { id: 'details', label: 'User Details', icon: '👤' },
      { id: 'statement', label: 'Statement', icon: '📄' },
      { id: 'insights', label: 'Insights', icon: '💡' },
      { id: 'analysis', label: 'Analysis', icon: '📈' },
      { id: 'consent', label: 'MFC Consent', icon: '✍️' },
      { id: 'approve', label: 'Approve', icon: '✅' },
    ],
    etf: [
      { id: 'linked', label: 'Linked Accounts', icon: '🔗' },
      { id: 'insights', label: 'Insights', icon: '💡' },
    ],
    equities: [
      { id: 'linked', label: 'Linked Accounts', icon: '🔗' },
      { id: 'holding-broker', label: 'Holding Broker', icon: '🏢' },
      { id: 'demat', label: 'Demat Holding', icon: '📦' },
      { id: 'broker', label: 'Broker Holding', icon: '💼' },
      { id: 'details', label: 'User Details', icon: '👤' },
      { id: 'combined', label: 'Equities + ETF', icon: '🔀' },
    ],
  };

  const renderContent = () => {
    const currentLoading = loading[`${activeTab}-${activeSubTab[activeTab]}`] || loading[activeTab];

    if (currentLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    switch (activeTab) {
      case 'portfolio':
        return data.userDetails ? (
          <FinancialDataDisplay data={data.userDetails} />
        ) : (
          <div className="text-center py-12 text-dark-textSecondary">
            <p>Failed to load portfolio data</p>
            <button
              onClick={loadUserDetails}
              className="mt-4 px-6 py-2 bg-accent-primary rounded-xl hover:bg-accent-primary/80 transition-all"
            >
              Retry
            </button>
          </div>
        );

      case 'mutualfunds':
        return <MutualFundsDisplay data={data.mutualfunds} />;

      case 'termdeposit':
        const tdData = data[`td-${activeSubTab.termdeposit}`];
        return <DataTable data={tdData} maxItems={10} />;

      case 'rddeposit':
        const rdData = data[`rd-${activeSubTab.rddeposit}`];
        return <DataTable data={rdData} maxItems={10} />;

      case 'mfdetails':
        const mfData = data[`mf-${activeSubTab.mfdetails}`];
        return <DataTable data={mfData} maxItems={10} />;

      case 'etf':
        const etfData = data[`etf-${activeSubTab.etf}`];
        return <DataTable data={etfData} maxItems={10} />;

      case 'equities':
        const eqData = data[`eq-${activeSubTab.equities}`];
        return <DataTable data={eqData} maxItems={10} />;

      case 'deposit':
        const depData = data[`dep-${activeSubTab.deposit}`];
        return <DataTable data={depData} maxItems={10} />;

      case 'firequest':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">👤</span>
                FI Request User
              </h3>
              <DataTable data={data['fi-user']} />
            </div>
            {data['fi-account'] && (
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="text-2xl">🏦</span>
                  FI Request Account
                </h3>
                <DataTable data={data['fi-account']} />
              </div>
            )}
          </div>
        );

      case 'fips':
        return <FIPsDisplay data={data.fips} />;

      case 'brokers':
        return <BrokersDisplay data={data.brokers} />;

      case 'nps':
        return <NPSLinkedAccountsDisplay data={data.nps} />;

      case 'consents':
        return <DataTable data={data.consents} title="Account Consents" icon="✅" />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/10 via-transparent to-accent-secondary/10" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-secondary/20 rounded-full blur-3xl animate-pulse" />

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-text">Finfactor</span> Account Aggregator
          </h1>
          <p className="text-dark-textSecondary text-lg">
            Complete financial data management platform
          </p>
        </motion.div>

        {/* Main Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as TabId)} />

        {/* Sub Tabs */}
        {subTabs[activeTab as keyof typeof subTabs] && (
          <SubTabs
            tabs={subTabs[activeTab as keyof typeof subTabs]}
            activeTab={activeSubTab[activeTab]}
            onTabChange={(id) => setActiveSubTab(prev => ({ ...prev, [activeTab]: id }))}
            category={activeTab}
          />
        )}

        {/* Content Area */}
        <motion.div
          key={`${activeTab}-${activeSubTab[activeTab]}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-effect rounded-2xl p-8 mb-12"
        >
          {renderContent()}
        </motion.div>

        {/* Actions Grid - Only show on portfolio tab */}
        {activeTab === 'portfolio' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <span className="w-2 h-8 bg-gradient-to-b from-accent-primary to-accent-secondary rounded-full" />
              Quick Actions
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Card 1: Unlink Account */}
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="glass-effect rounded-2xl p-6 hover:border-accent-danger transition-colors"
              >
                <div className="w-12 h-12 bg-accent-danger/20 rounded-xl flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-accent-danger"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Unlink Account</h3>
                <p className="text-dark-textSecondary text-sm mb-6">
                  Remove linked bank account from the system
                </p>
                <button
                  onClick={handleDelinkAccount}
                  disabled={actionLoading === 'delink'}
                  className="w-full bg-accent-danger hover:bg-accent-danger/80 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === 'delink' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Delink'
                  )}
                </button>
              </motion.div>

              {/* Card 2: Connect Bank (Web Flow) */}
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="glass-effect rounded-2xl p-6 hover:border-accent-primary transition-colors"
              >
                <div className="w-12 h-12 bg-accent-primary/20 rounded-xl flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-accent-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Connect Bank</h3>
                <p className="text-dark-textSecondary text-sm mb-6">
                  Initiate web flow to connect your bank account
                </p>
                <button
                  onClick={handleConnectBank}
                  disabled={actionLoading === 'connect'}
                  className="w-full bg-accent-primary hover:bg-accent-primary/80 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === 'connect' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Connect'
                  )}
                </button>
              </motion.div>

              {/* Card 3: Direct Consent (V1) */}
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="glass-effect rounded-2xl p-6 hover:border-accent-secondary transition-colors"
              >
                <div className="w-12 h-12 bg-accent-secondary/20 rounded-xl flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-accent-secondary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Direct Consent</h3>
                <p className="text-dark-textSecondary text-sm mb-6">
                  Submit consent request using V1 API
                </p>
                <button
                  onClick={handleDirectConsent}
                  disabled={actionLoading === 'consent'}
                  className="w-full bg-accent-secondary hover:bg-accent-secondary/80 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === 'consent' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
              </motion.div>
            </div>

            {/* Consent V1 Response Display */}
            <AnimatePresence>
              {consentV1Data && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="glass-effect rounded-2xl p-8"
                >
                  <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                    <span className="w-2 h-8 bg-gradient-to-b from-accent-secondary to-accent-primary rounded-full" />
                    Consent Response
                  </h3>
                  <DataTable data={consentV1Data} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
