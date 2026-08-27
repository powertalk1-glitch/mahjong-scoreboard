import React, { useState } from 'react';
import { History, RotateCcw, Trophy, Skull, Coins, Users, Settings, X, Edit3, Save } from 'lucide-react';

export default function App() {
  // 1. 玩家狀態與分數 (使用 ID 追蹤，方便改名)
  const [players, setPlayers] = useState([
    { id: 0, name: '爸爸', score: 0 },
    { id: 1, name: '媽媽', score: 0 },
    { id: 2, name: '姐姐', score: 0 },
    { id: 3, name: '哥哥', score: 0 }
  ]);

  // 2. 自訂金額按鈕
  const [quickAmounts, setQuickAmounts] = useState([50, 100, 200, 300, 500, 1000]);

  // 交易紀錄
  const [history, setHistory] = useState([]);

  // 表單狀態
  const [winnerId, setWinnerId] = useState(null);
  const [loserId, setLoserId] = useState(null); // null 代表自摸模式下的無特定輸家
  const [amount, setAmount] = useState('');
  const [isZimo, setIsZimo] = useState(false);

  // 設定視窗狀態
  const [showSettings, setShowSettings] = useState(false);
  
  // 暫存設定狀態 (用於編輯時)
  const [tempPlayerNames, setTempPlayerNames] = useState({});
  const [tempAmounts, setTempAmounts] = useState('');

  // 開啟設定時載入現有資料
  const openSettings = () => {
    const names = {};
    players.forEach(p => names[p.id] = p.name);
    setTempPlayerNames(names);
    setTempAmounts(quickAmounts.join(', '));
    setShowSettings(true);
  };

  // 儲存設定
  const saveSettings = () => {
    // 更新名字
    const newPlayers = players.map(p => ({
      ...p,
      name: tempPlayerNames[p.id] || p.name
    }));
    setPlayers(newPlayers);

    // 更新金額按鈕
    const newAmounts = tempAmounts.split(/[,，\s]+/).map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v > 0);
    if (newAmounts.length > 0) {
      setQuickAmounts(newAmounts);
    }

    setShowSettings(false);
  };

  const handleTransaction = () => {
    if (winnerId === null || !amount) return;
    if (!isZimo && loserId === null) return;

    const val = parseInt(amount);
    if (isNaN(val) || val <= 0) return;

    const newPlayers = [...players];
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let logEntry = {};

    const winnerName = players.find(p => p.id === winnerId).name;

    if (isZimo) {
      // 自摸邏輯：贏家 + (3 * 金額)，其餘三家 - 金額
      const winAmount = val * 3;
      
      newPlayers.forEach(p => {
        if (p.id === winnerId) {
          p.score += winAmount;
        } else {
          p.score -= val;
        }
      });

      logEntry = {
        id: Date.now(),
        time: timestamp,
        desc: `${winnerName} 自摸，每家付 ${val}`,
        type: 'zimo',
        winnerId: winnerId,
        winnerName: winnerName, // 紀錄當下名字
        valPerPerson: val,
        totalWin: winAmount
      };

    } else {
      // 胡牌邏輯：輸家付給贏家
      if (winnerId === loserId) return;
      
      const loserName = players.find(p => p.id === loserId).name;

      newPlayers.forEach(p => {
        if (p.id === winnerId) p.score += val;
        if (p.id === loserId) p.score -= val;
      });

      logEntry = {
        id: Date.now(),
        time: timestamp,
        desc: `${winnerName} 胡了 ${loserName} (放槍)`,
        type: 'ron',
        winnerId: winnerId,
        loserId: loserId,
        winnerName: winnerName,
        loserName: loserName,
        amount: val
      };
    }

    setPlayers(newPlayers);
    setHistory([logEntry, ...history]);
    
    // 重置表單 (保留模式選擇，方便連續記帳)
    setWinnerId(null);
    setLoserId(null);
    setAmount('');
  };

  const undoLast = () => {
    if (history.length === 0) return;
    const lastLog = history[0];
    const newPlayers = [...players];

    if (lastLog.type === 'zimo') {
      newPlayers.forEach(p => {
        if (p.id === lastLog.winnerId) {
          p.score -= lastLog.totalWin;
        } else {
          p.score += lastLog.valPerPerson;
        }
      });
    } else {
      newPlayers.forEach(p => {
        if (p.id === lastLog.winnerId) p.score -= lastLog.amount;
        if (p.id === lastLog.loserId) p.score += lastLog.amount;
      });
    }

    setPlayers(newPlayers);
    setHistory(history.slice(1));
  };

  const getRankColor = (score) => {
    if (score > 0) return 'text-yellow-400 font-bold';
    if (score < 0) return 'text-red-400 font-bold';
    return 'text-white';
  };

  const getCardStyle = (score) => {
    if (score > 0) return 'bg-emerald-800 border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
    if (score < 0) return 'bg-red-900/40 border border-red-800';
    return 'bg-slate-800 border border-slate-700';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 rounded-lg">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">麻將風雲榜</h1>
              <p className="text-slate-400 text-sm">自動計算 · 清楚記帳</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={openSettings}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
              title="設定"
            >
              <Settings className="w-6 h-6" />
            </button>
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-500">目前局數</div>
              <div className="font-mono text-xl">{history.length}</div>
            </div>
          </div>
        </div>

        {/* Score Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {players.map((player) => (
            <div 
              key={player.id} 
              className={`relative p-5 rounded-2xl transition-all duration-300 ${getCardStyle(player.score)}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-slate-300 text-sm font-medium truncate pr-2" title={player.name}>
                    {player.name}
                </span>
                {player.score > 0 && <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
              </div>
              <div className={`text-3xl md:text-4xl text-center font-mono my-2 ${getRankColor(player.score)}`}>
                {player.score > 0 ? `+${player.score}` : player.score}
              </div>
              <div className="text-xs text-center text-slate-500 mt-2">
                {player.score === 0 ? '平手' : player.score > 0 ? '贏家中' : '加油'}
              </div>
            </div>
          ))}
        </div>

        {/* Control Panel */}
        <div className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            <h2 className="text-lg font-semibold">記帳櫃台</h2>
          </div>

          <div className="space-y-6">
            {/* 1. Transaction Type */}
            <div className="flex p-1 bg-slate-900 rounded-xl w-full sm:w-fit">
              <button
                onClick={() => { setIsZimo(false); setLoserId(null); }}
                className={`flex-1 sm:w-32 py-2 px-4 rounded-lg text-sm font-medium transition-all ${!isZimo ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                胡牌 (放槍)
              </button>
              <button
                onClick={() => { setIsZimo(true); setLoserId(null); }}
                className={`flex-1 sm:w-32 py-2 px-4 rounded-lg text-sm font-medium transition-all ${isZimo ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                自摸
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Who Won/Lost */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" /> 誰贏了?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {players.map(p => (
                      <button
                        key={`winner-${p.id}`}
                        onClick={() => {
                          setWinnerId(p.id);
                          if (loserId === p.id) setLoserId(null);
                        }}
                        className={`py-3 rounded-xl text-sm font-bold border-2 transition-all truncate ${
                          winnerId === p.id 
                            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' 
                            : 'bg-slate-800 border-transparent hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {!isZimo && (
                  <div className={`transition-opacity duration-300 ${winnerId === null ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                      <Skull className="w-4 h-4 text-red-500" /> 誰放槍?
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {players.map(p => (
                        <button
                          key={`loser-${p.id}`}
                          disabled={winnerId === p.id}
                          onClick={() => setLoserId(p.id)}
                          className={`py-3 rounded-xl text-sm font-bold border-2 transition-all truncate ${
                            winnerId === p.id 
                              ? 'opacity-20 cursor-not-allowed border-transparent' 
                              : loserId === p.id
                                ? 'bg-red-500/20 border-red-500 text-red-400'
                                : 'bg-slate-800 border-transparent hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {isZimo && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    三家通賠模式
                  </div>
                )}
              </div>

              {/* Right Column: Amount */}
              {/* Modified: Removed pointer-events-none to fix input issue */}
              <div className="space-y-4">
                <label className="text-sm text-slate-400 mb-2 block">
                  {isZimo ? '每家金額 (台數錢 + 底)' : '金額'}
                </label>
                
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="輸入金額"
                    className="w-full bg-slate-900 border-2 border-slate-700 focus:border-blue-500 rounded-xl py-4 pl-8 pr-4 text-2xl font-mono text-white placeholder-slate-600 outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setAmount(amt.toString())}
                      className="py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm font-mono transition-colors"
                    >
                      {amt}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleTransaction}
                  // Validation: Button disabled only if data incomplete
                  disabled={winnerId === null || !amount || (!isZimo && loserId === null)}
                  className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:shadow-none"
                >
                  確認記帳
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* History Log */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              戰況紀錄
            </h2>
            {history.length > 0 && (
              <button 
                onClick={undoLast}
                className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> 復原上一步
              </button>
            )}
          </div>

          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                尚未開始，請先輸入第一筆戰績
              </div>
            ) : (
              history.map((log) => (
                <div key={log.id} className="flex justify-between items-center p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500">{log.time}</span>
                    <div>
                      <div className="font-medium text-slate-200">
                        {log.desc}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {log.type === 'zimo' 
                          ? `贏家總計 +${log.totalWin}` 
                          : `${log.winnerName} +${log.amount}, ${log.loserName} -${log.amount}`}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-emerald-400 font-bold">
                    {log.type === 'zimo' ? `+${log.totalWin}` : `+${log.amount}`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5" /> 設定
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Player Names Settings */}
              <div>
                <label className="text-sm font-medium text-slate-400 mb-3 block flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> 玩家名稱
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {players.map(p => (
                    <div key={p.id}>
                      <input
                        type="text"
                        value={tempPlayerNames[p.id] || ''}
                        onChange={(e) => setTempPlayerNames({ ...tempPlayerNames, [p.id]: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Default Amounts Settings */}
              <div>
                <label className="text-sm font-medium text-slate-400 mb-3 block flex items-center gap-2">
                  <Coins className="w-4 h-4" /> 預設快選金額
                </label>
                <input
                  type="text"
                  value={tempAmounts}
                  onChange={(e) => setTempAmounts(e.target.value)}
                  placeholder="例如: 50, 100, 200 (用逗號分隔)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none font-mono"
                />
                <p className="text-xs text-slate-500 mt-2">請使用逗號分隔不同的金額選項</p>
              </div>

              <div className="pt-4">
                <button
                  onClick={saveSettings}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  <Save className="w-4 h-4" /> 儲存設定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}