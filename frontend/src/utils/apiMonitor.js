// API Call Monitor - Debug utility
let apiCallCount = 0;
const apiCallLog = [];

export const monitorApiCall = (url, method = 'GET') => {
    apiCallCount++;
    const callInfo = {
        id: apiCallCount,
        url,
        method,
        timestamp: new Date().toISOString(),
        component: document.title || 'Unknown'
    };

    apiCallLog.push(callInfo);

    console.log(`🔔 API Call #${apiCallCount}:`, {
        url,
        method,
        timestamp: callInfo.timestamp
    });

    return callInfo;
};

export const getApiCallStats = () => {
    const stats = {
        totalCalls: apiCallCount,
        uniqueUrls: [...new Set(apiCallLog.map(call => call.url))].length,
        duplicateCalls: apiCallLog.length - [...new Set(apiCallLog.map(call => `${call.url}-${call.method}`))].length,
        recentCalls: apiCallLog.slice(-10)
    };

    console.table(apiCallLog);
    return stats;
};

export const resetApiCallLog = () => {
    apiCallCount = 0;
    apiCallLog.length = 0;
    console.log('🧹 API call log reset');
};

// Add to window for easy debugging
if (typeof window !== 'undefined') {
    window.apiDebug = {
        getStats: getApiCallStats,
        reset: resetApiCallLog,
        log: apiCallLog
    };
}
