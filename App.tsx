
import React, { useState, useEffect, useCallback } from 'react';
import { Tribe, User, GameState, HexData, GameAction, TribeStats } from './types';
import TribeCreation from './components/TribeCreation';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import AdminPanel from './components/AdminPanel';
import MapEditor from './components/MapEditor';
import ForgotPassword from './components/ForgotPassword';
import Leaderboard from './components/Leaderboard';
import TransitionScreen from './components/TransitionScreen';
import * as api from './lib/api';
import * as Auth from './lib/auth';

type View = 'login' | 'register' | 'game' | 'admin' | 'create_tribe' | 'map_editor' | 'forgot_password' | 'leaderboard' | 'transition' | 'loading';

type TribeCreationData = {
    playerName: string;
    tribeName: string;
    icon: string;
    stats: TribeStats;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [view, setView] = useState<View>('loading');
  const [transitionMessage, setTransitionMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const fetchGameState = useCallback(async () => {
      try {
        setError(null);
        const state = await api.getGameState();
        setGameState(state);
        return state;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch game state.');
        Auth.logout();
        setCurrentUser(null);
        setView('login');
        return null;
      }
  }, []);

  const initializeApp = useCallback(async () => {
    const token = Auth.getToken();
    if (token) {
        try {
            const user = await api.getMe();
            setCurrentUser(user);
            const state = await fetchGameState();
            if(user.role === 'admin') {
                setView('game');
            } else {
                const userTribe = state?.tribes.find(t => t.playerId === user.id);
                setView(userTribe ? 'game' : 'create_tribe');
            }
        } catch (e) {
            handleLogout(); // Token is invalid or expired
        }
    } else {
        setView('login');
    }
  }, [fetchGameState]);


  useEffect(() => {
    initializeApp();
  }, [initializeApp]);
  
  const handleLoginSuccess = async (user: User, token: string) => {
    Auth.saveToken(token);
    setCurrentUser(user);
    setView('loading');
    const state = await fetchGameState();
    if (state) {
        if (user.role === 'admin') {
            setView('game');
        } else {
            const userTribe = state.tribes.find(t => t.playerId === user.id);
            setView(userTribe ? 'game' : 'create_tribe');
        }
    }
  };

  const handleRegisterSuccess = (user: User, token: string) => {
    handleLoginSuccess(user, token);
  };

  const handleLogout = () => {
    Auth.logout();
    setCurrentUser(null);
    setGameState(null);
    setView('login');
  };

  const handleTribeCreate = async (tribeData: TribeCreationData) => {
    try {
        await api.createTribe(tribeData);
        await fetchGameState();
        setView('game');
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create tribe.');
    }
  };
  
  const handleFinalizePlayerTurn = async (tribeId: string, plannedActions: GameAction[], journeyResponses: Tribe['journeyResponses']) => {
    try {
        await api.submitTurn(tribeId, plannedActions, journeyResponses);
        await fetchGameState();
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to finalize turn.');
    }
  };
  
  const handleUpdateTribe = async (updatedTribe: Tribe) => {
      try {
        await api.updateTribe(updatedTribe);
        await fetchGameState();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update tribe.');
      }
  };

  const handleProcessGlobalTurn = async () => {
      try {
        setTransitionMessage('Processing Turn...');
        setView('transition');
        await api.processTurn();
        await fetchGameState();
        setTransitionMessage('');
        setView('game');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process turn.');
        setView('admin'); // Go back to admin panel on error
      }
  };

  const handleUpdateMap = async (newMapData: HexData[], newStartingLocations: string[]) => {
    try {
        await api.updateMap(newMapData, newStartingLocations);
        await fetchGameState();
        setView('admin');
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update map.');
    }
  };

  const handleRemovePlayer = async (userIdToRemove: string) => {
    try {
        await api.removePlayer(userIdToRemove);
        await fetchGameState();
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove player.');
    }
  };

  const handleStartNewGame = async () => {
    try {
        await api.startNewGame();
        await fetchGameState();
        alert('New game started! All tribes and requests have been removed and the turn has been reset to 1.');
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start new game.');
    }
  };

  const handleLoadBackup = async (backupFile: File) => {
    try {
        await api.loadBackup(backupFile);
        alert('Backup uploaded successfully! The server is processing the state. The game will now reload.');
        initializeApp(); // Re-initialize the app to fetch the new state
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load backup.');
        alert(`Error loading backup: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  const handleApiAction = async (action: Function, ...args: any[]) => {
    try {
        await action(...args);
        await fetchGameState();
    } catch(err) {
        alert(err instanceof Error ? err.message : 'An unknown error occurred.');
    }
  };

  const renderView = () => {
    if (view === 'loading' || !gameState) {
        return <TransitionScreen message={gameState ? 'Loading...' : 'Connecting to the Wasteland...'} />;
    }

    switch (view) {
      case 'login':
        return <Login 
          onLoginSuccess={handleLoginSuccess} 
          onSwitchToRegister={() => setView('register')} 
          onNavigateToForgotPassword={() => setView('forgot_password')}
        />;
      
      case 'register':
        return <Register onRegisterSuccess={handleRegisterSuccess} onSwitchToLogin={() => setView('login')} />;

      case 'forgot_password':
        return <ForgotPassword onSuccess={() => setView('login')} onCancel={() => setView('login')} />;

      case 'create_tribe':
        if (!currentUser) { setView('login'); return null; }
        const usedIcons = gameState.tribes.map(t => t.icon);
        return <TribeCreation onTribeCreate={handleTribeCreate} user={currentUser} usedIcons={usedIcons} />;
      
      case 'transition':
        return <TransitionScreen message={transitionMessage} />;

      case 'admin':
        if (!currentUser || currentUser.role !== 'admin') { setView('login'); return null; }
        return <AdminPanel 
            gameState={gameState}
            onBack={() => setView('game')} 
            onNavigateToEditor={() => setView('map_editor')}
            onProcessTurn={handleProcessGlobalTurn}
            onRemovePlayer={handleRemovePlayer}
            onStartNewGame={handleStartNewGame}
            onLoadBackup={handleLoadBackup}
            onApproveChief={(reqId) => handleApiAction(api.approveChiefRequest, reqId)}
            onDenyChief={(reqId) => handleApiAction(api.denyChiefRequest, reqId)}
            onApproveAsset={(reqId) => handleApiAction(api.approveAssetRequest, reqId)}
            onDenyAsset={(reqId) => handleApiAction(api.denyAssetRequest, reqId)}
            onAddAITribe={() => handleApiAction(api.addAITribe)}
        />;
      
      case 'map_editor':
        if (!currentUser || currentUser.role !== 'admin') { setView('login'); return null; }
        return <MapEditor 
          initialMapData={gameState.mapData}
          initialMapSettings={gameState.mapSettings}
          initialMapSeed={gameState.mapSeed}
          initialStartLocations={gameState.startingLocations}
          onSave={handleUpdateMap}
          onCancel={() => setView('admin')}
        />

      case 'leaderboard':
        if (!currentUser) { setView('login'); return null; }
        const playerTribeForLeaderboard = gameState.tribes.find(t => t.playerId === currentUser.id);
        return <Leaderboard 
            gameState={gameState}
            playerTribe={playerTribeForLeaderboard}
            onBack={() => setView('game')}
          />;

      case 'game':
      default:
        if (!currentUser) { setView('login'); return null; }
        const playerTribe = gameState.tribes.find(t => t.playerId === currentUser.id);
        
        if (!playerTribe && currentUser.role !== 'admin') { setView('create_tribe'); return null; }

        return (
          <Dashboard
            currentUser={currentUser}
            playerTribe={playerTribe}
            allTribes={gameState.tribes}
            turn={gameState.turn}
            mapData={gameState.mapData}
            startingLocations={gameState.startingLocations}
            allChiefRequests={gameState.chiefRequests || []}
            allAssetRequests={gameState.assetRequests || []}
            journeys={gameState.journeys || []}
            diplomaticProposals={gameState.diplomaticProposals || []}
            onFinalizeTurn={(actions, journeyResponses) => playerTribe && handleFinalizePlayerTurn(playerTribe.id, actions, journeyResponses)}
            onRequestChief={(chiefName, address) => handleApiAction(api.requestChief, playerTribe!.id, chiefName, address)}
            onRequestAsset={(assetName, address) => handleApiAction(api.requestAsset, playerTribe!.id, assetName, address)}
            onUpdateTribe={handleUpdateTribe}
            onLogout={handleLogout}
            onNavigateToAdmin={() => setView('admin')}
            onNavigateToLeaderboard={() => setView('leaderboard')}
            onProposeAlliance={(toTribeId) => handleApiAction(api.proposeAlliance, playerTribe!.id, toTribeId)}
            onSueForPeace={(toTribeId, reparations) => handleApiAction(api.sueForPeace, playerTribe!.id, toTribeId, reparations)}
            onDeclareWar={(toTribeId) => handleApiAction(api.declareWar, playerTribe!.id, toTribeId)}
            onAcceptProposal={(proposalId) => handleApiAction(api.respondToProposal, proposalId, true)}
            onRejectProposal={(proposalId) => handleApiAction(api.respondToProposal, proposalId, false)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-0 sm:p-0 lg:p-0">
      <div className="max-w-full">
        {error && (
            <div className="bg-red-800 text-white p-4 text-center fixed top-0 left-0 right-0 z-50" role="alert">
                <strong>Error:</strong> {error}
                <button onClick={() => setError(null)} className="ml-4 font-bold">X</button>
            </div>
        )}
        {renderView()}
      </div>
    </div>
  );
};

export default App;