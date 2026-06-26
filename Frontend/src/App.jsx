import { useState, useEffect } from "react";
import { ethers } from "ethers";
import contractAbi from "./AarX.json";
import "./App.css";

const CONTRACT_ADDRESS = "0x790C519DBF5b86E1AA2bEC03d94C95B628F8A50A";

function App() {

  //Variable declaration for connection to the backend smart contract 
  const [acc, setAcc] = useState("");
  const [owner, setOwner] = useState("");
  const [balance, setBalance] = useState("0");
  const [showBalance, setShowBalance] = useState(false);
  const [supply, setSupply] = useState(0);
  const [maxCap, setMaxCap] = useState(1000);
  const [isDestroyed, setIsDestroyed] = useState(false);

  //Variable declaration for currency features in the frontend 
  const [mint, setMint] = useState("");
  const [burn, setBurn] = useState("");
  const [transfer, setTransfer] = useState("");
  const [transferAmt, setTransferAmt] = useState("");
  const [loading, setLoading] = useState(false);

  //Variable declaration for the token dashboard features
  const [darkMode, setDarkMode] = useState(true);
  const [notification, setNotification] = useState({ type: "", message: "", txHash: "" });
  const [leaderboard, setLeaderboard] = useState([]);

  //****************************** LeaderBoard SETUP ***********************************//
  
  const fetchLeaderboardData = async (contractInstance) => {
    try {

      // 1. The code below keeps the track of all wallet address which has previously minted my tokens so that the leaderboard can show the top 3 currency holders
      // The leaderboard already has the data of two of my own metamask accounts so that the user gets an idea of how it works 
       
      const [mintLogs, burnLogs, transferLogs] = await Promise.all([
        contractInstance.queryFilter(contractInstance.filters.mint(), 0, "latest"),
        contractInstance.queryFilter(contractInstance.filters.burn(), 0, "latest"),
        contractInstance.queryFilter(contractInstance.filters.transfer(), 0, "latest"),
      ]);

      const uniqueAddresses = new Set();

      //Keeping track of all unique accounts who has minted the tokens  
      mintLogs.forEach((log) => {
        if (log.args && log.args[0]) uniqueAddresses.add(log.args[0].toLowerCase());
      });

      //Keeping track of all unique accounts who has burned the tokens
      burnLogs.forEach((log) => {
        if (log.args && log.args[0]) uniqueAddresses.add(log.args[0].toLowerCase());
      });

      //Keeping track of all unique accounts involved in transfering tokens (sender and receiver)
      transferLogs.forEach((log) => {
        if (log.args) {
          const [from, to] = log.args;
          if (from && from !== ethers.ZeroAddress) uniqueAddresses.add(from.toLowerCase());
          if (to && to !== ethers.ZeroAddress) uniqueAddresses.add(to.toLowerCase());
        }
      });

      // 2.Filtering the exact on-chain balance for each unique wallet address found in the contract
      const leaderboardPromises = Array.from(uniqueAddresses).map(async (addr) => {
        try {
          const rawBalance = await contractInstance.showbalance(addr);
          return {
            address: addr,
            amount: parseFloat(ethers.formatUnits(rawBalance, 18)),
          };
        } catch (err) {
          console.error(`Error in querying balance for address ${addr}:`, err);
          alert(`Error in querying balance for address ${addr}:`);
          return { address: addr, amount: 0 };
        }
      });

      const resolvedLeaderboard = await Promise.all(leaderboardPromises);

      // 3. Sorting and filtering the accounts to extract the top 3 accounts
      const computedLeaderboard = resolvedLeaderboard
        .filter((item) => item.amount > 0)
        .sort((a, b) => b.amount - a.amount);

      setLeaderboard(computedLeaderboard);

      } catch (err) {
        console.error("Calculation error", err);
        alert("Calculation error")
      }
  };
  //************************************************************************************************//

  // 1.Fetching the system metrics & user balance
  const fetchBlockchainData = async (userAddress) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, provider);

      const bal = await contract.showbalance(userAddress);
      const total = await contract.totalsupply();
      const cap = await contract.max_cap();
      const ownerAddress = await contract.owner();
      const destroyedStatus = await contract.destroy();

      //conversion to 'wei' from 'ether' => 1 ether = 10^18 wei
      setBalance(ethers.formatUnits(bal, 18)); 
      setSupply(parseFloat(ethers.formatUnits(total, 18)));
      setMaxCap(parseFloat(ethers.formatUnits(cap, 18)));

      setOwner(ownerAddress.toLowerCase());
      setIsDestroyed(destroyedStatus);

      //Synchronizing the leaderboard data with the user's data
      await fetchLeaderboardData(contract);
    } catch (err) {
      console.error("Synchronization error:", err);
    }
  };

  //Whenever a user comes to this website the "useEffect" react hook initializes the dashboard page 2 asynchronously so that it does have to wait for the user to connect his/her wallet
  //Secondly it also helps in calculating and filtering the leaderboard data everytime a new user arrives 

  useEffect(() => {
    const initDashboardData = async () => {
      if (window.ethereum) { //A check for Web3 provider extension like MetaMask in the user's browser
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, provider);
          await fetchLeaderboardData(contract);
        } catch (err) {
          console.error("Initialization error", err);
          alert("Initialization error");
        }
      }
    };
    initDashboardData();
  }, []);

  // 2. Updating the user's account data dynamically whenever an action is performed on the contract without expecting the user to reload or refresh the page
  useEffect(() => {
    if (!acc) return; // A check for valid account

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, provider);

    const handleEventTrigger = (eventType, amt, txHash) => {
      fetchBlockchainData(acc);
      
      //Notification bar logic at the bottom of the screen whenever any action like minting, burning, transfering is performed
      setNotification({
        type: "SUCCESS",
        message: `${eventType} ${ethers.formatUnits(amt, 18)} ARX successfully!`,
        txHash: txHash,
      });
    };

    contract.on("mint", (to, amount, tx) => handleEventTrigger("Minted", amount, tx.log.transactionHash));
    contract.on("burn", (from, amount, tx) => handleEventTrigger("Burned", amount, tx.log.transactionHash));
    contract.on("transfer", (from, to, amount, tx) => {
      fetchBlockchainData(acc);
      if (from !== ethers.ZeroAddress) { // Check for valid receiver's address 
        setNotification({
          type: "SUCCESS",
          message: `Transferred ${ethers.formatUnits(amount, 18)} ARX successfully!`,
          txHash: tx.log.transactionHash,
        });
      }
    });

    //The function below handles runtime account modifications directly via MetaMask interface switching
    //This allows the user to switch their accounts inside the same metamask wallet
    const handleAccountsChanged = (accs) => {
      if (accs.length > 0) {
        setAcc(accs[0]);
        fetchBlockchainData(accs[0]);
      } else {
        setAcc("");
      }
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    return () => {
      contract.removeAllListeners("mint");
      contract.removeAllListeners("burn");
      contract.removeAllListeners("transfer");
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, [acc]);

  //3. Whenever a user arrives at the landing page(account linking page) of the website, the function below allows the user to select any account inside their metamask wallet
  //This removes single account auto-connection
  const connectWallet = async () => {
    if (!window.ethereum) return alert("MetaMask not found!");
    try {
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accs = await provider.send("eth_accounts", []);
      if (accs.length > 0) {
        setAcc(accs[0]);
        fetchBlockchainData(accs[0]);
      }
    } catch (err) {
      console.error("Wallet connectivity error", err);
      alert("Wallet connectivity error");
    }
  };

  // 4. As writing data to the blockchain requires gas fees and cryptographic signatures this function handles the user interface security, it signs the transactions via MetaMask, waits for the Ethereum network to mine the transaction, adding data to blockcahin and thus safely updates the application forms afterward
  const executeTransaction = async (e, actionType, ...args) => {
    
    e.preventDefault(); //Standard function to avoid reloading the webpage whenver an action is performed on the contract

    if (loading || isDestroyed) return; //checks whether the self-destruct function is active or not 

    try {

      setLoading(true); //Changes the button innerHTML to "PROCESSING....."

      setNotification({ type: "", message: "", txHash: "" });
      const provider = new ethers.BrowserProvider(window.ethereum); //Opens up metamask 
      const signer = await provider.getSigner(); //Waits for the user to confirm the transaction
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer); //connects the contract code to the blockchain network

      let tx; 

      //Nested if-else for each feature of the contract currency
      if (actionType === "mint") {
        tx = await contract.mintWithRewards(ethers.parseUnits(args[0], 18));
      } else if (actionType === "burn") {
        tx = await contract.burnToken(ethers.parseUnits(args[0], 18));
      } else if (actionType === "transfer") {
        tx = await contract.transferTokens(args[0], ethers.parseUnits(args[1], 18));
      } else if (actionType === "kill") {
        //A safety check before destroying the contract
        if (!window.confirm("Are you sure you want to destroy the currency ?")) return;
        tx = await contract.selfDestruct(); 
      }

      await tx.wait(); //This bounds the contract to wait until and unless a transaction is successfuly completed

      setMint(""); setBurn(""); setTransfer(""); setTransferAmt(""); //Clearing the input boxes once a transaction is done

    } catch (err) {
      console.error(err); 
      setNotification({ type: "ERROR", message: "Transaction reverted or denied.", txHash: "" });
    } finally {
      setLoading(false);
    }
  };


  //=================================HTML SETUP=========================================//

  return (
    
    //Light and Dark mode toggle declaration 
    <div className="wrapper" data-theme={darkMode ? "dark" : "light"}> 

    {/*Check whether the owner has destroyed the contract or not*/}
    {isDestroyed && (
      <div className="destroy-banner">ERROR : THE CONTRACT IS DESTROYED !!</div>
    )}
    
    {/********************************Header*******************************************/}
    <header className="header">
      <div style={{ fontWeight: "bold", fontSize: "15px" }}>WELCOME to AarX Token DashBoard</div>
      
      <div style={{ fontSize: "15px", fontFamily: "monospace" }}>
        Total Supply: {supply.toLocaleString()} / {maxCap.toLocaleString()} ARX
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>

        <button onClick={() => setDarkMode(!darkMode)} className="theme-toggle">
          {darkMode ? "Light UI" : "Dark UI"}
        </button>

        {acc && (
          <span className="address-badge">{acc.slice(0, 6)}...{acc.slice(-4)}</span>
        )}

      </div>
    </header>
    {/*********************************************************************************/}

    {/*Deciding which page to pop up - landing page or dashboard page using ternary operator on the basis of whether the user has connected his account or not*/}

    {!acc ? (
      <div style={{ textAlign: "center", padding: "150px 20px" }}>
        <h3 style={{ color: darkMode ? "#fff" : "#000", marginBottom: "25px", fontSize: "22px" }}>
          Please connect your Web3 wallet terminal interface to proceed.
        </h3>
        <button onClick={connectWallet} className="connect-btn" style={{ padding: "16px 36px", fontSize: "16px" }}>
          Link MetaMask
        </button>
      </div>
    ) : (
      <main className="dashboard-grid">
        
        {/************************** MAIN : Left Column Controls *******************/}

        <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/*****************Wallet Balance Card****************/}
          <div className="panel-card">

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="panel-title">WALLET BALANCE</div>

              <button 
                onClick={() => setShowBalance(!showBalance)} 
                className="theme-toggle" 
                style={{ padding: "4px 10px", borderColor: "#007bff", color: "#007bff" }}
              >
                {showBalance ? "Hide Balance" : "Show Balance"} 
              </button>

            </div>

            <div className="balance-text">
              {showBalance 
                ? `${parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })} ARX`
                : "•••••• ARX"
              }
            </div>
          </div>

          <div className="panel-card" style={{ flex: 1 }}>
            
            <div className="panel-title">CURRENCY FEATURES</div>
            
            {/**************Mint Form*******************/}
            <form onSubmit={(e) => executeTransaction(e, "mint", mint)} className="form-box">
              <label className="label">Mint Tokens (10% reward on every minting)</label>

              <input type="number" step="any" placeholder="Input Amount (e.g. 100)" value={mint} onChange={(e) => setMint(e.target.value)} required className="input-field" disabled={isDestroyed}/>

              <button type="submit" className="action-btn" disabled={loading || isDestroyed}>{loading ? "PROCESSING..." : "Mint Tokens"}</button>

            </form>

            {/***************Burn Form******************/}
            <form onSubmit={(e) => executeTransaction(e, "burn", burn)} className="form-box">
              <label className="label">Burn Tokens</label>

              <input type="number" step="any" placeholder="Input Amount (e.g. 50)" value={burn} onChange={(e) => setBurn(e.target.value)} required className="input-field" disabled={isDestroyed}/>

              <button type="submit" className="action-btn" style={{ background: "#8b0000" }} disabled={loading || isDestroyed}>{loading ? "PROCESSING..." : "Burn Tokens"}</button>

            </form>

            {/********************Transfer Form***************/}
            <form onSubmit={(e) => executeTransaction(e, "transfer", transfer, transferAmt)} className="form-box">

              <label className="label">Transfer Tokens</label>

              <input type="text" placeholder="Recipient Address (0x...)" value={transfer} onChange={(e) => setTransfer(e.target.value)} required className="input-field" style={{ marginBottom: "8px" }} disabled={isDestroyed}/>

              <input type="number" step="any" placeholder="Input Amount" value={transferAmt} onChange={(e) => setTransferAmt(e.target.value)} required className="input-field" disabled={isDestroyed}/>

              <button type="submit" className="action-btn" style={{ background: "#006400" }} disabled={loading || isDestroyed}>{loading ? "PROCESSING..." : "Transfer"}</button>

            </form>
          </div>
        </section>

        {/********************MAIN : Right Column Controls & Features*******************/}

        <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/****************Leaderboard Panel****************/}
          <div className="panel-card" style={{ flex: 1 }}>
            <div className="panel-title">LEADERBOARD</div>

            <div className="table-header">
              <span>Rank</span><span>Wallet Address</span><span>Current Balance</span>
            </div>

            <div style={{ borderBottom: darkMode ? "1px solid #444" : "1px solid #ccc", margin: "5px 0 10px 0" }} />

            {/* Using ternary operators to check whether any account has interacted with the contract yet */}
            {leaderboard.length === 0 ? (
              <div style={{ fontSize: "14px", color: "#888", textAlign: "center", marginTop: "40px" }}>No activity captured on chain yet</div>
            ) : (
              leaderboard.slice(0, 10).map((user, idx) => (
                <div key={idx} className="table-row">
                  <span>{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}</span>

                  <span className="mono-font">{user.address}</span>

                  <span style={{ fontWeight: "bold" }}>{user.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ARX</span>
                </div>
              ))
            )}
          </div>

          {/***********Destroy Contract Card**********/}
          {acc.toLowerCase() === owner && (
            <div className="panel-card" style={{ border: "1px solid rgba(128,128,128,0.25)" }}>

              <div className="panel-title" style={{ color: "#ff4d4d" }}>Owner Access only</div>

              <button onClick={(e) => executeTransaction(e, "kill")} className="destroy-btn" disabled={isDestroyed}>
                {isDestroyed ? "CURRENCY DESTROYED" : "DESTROY CURRENCY"}
              </button>

            </div>
          )}

        </section>
      </main>
    )}

    {/**************************Footer : Notification Block*****************************/}
    {notification.message && (
      <footer className="footer" style={{ backgroundColor: notification.type === "SUCCESS" ? "#1e4620" : "#5c1e1e" }}>

        <div>[{notification.type}] {notification.message}</div>

        {notification.txHash && (
          <a href={`https://sepolia.etherscan.io/tx/${notification.txHash}`} target="_blank" rel="noreferrer" className="tx-link">
            Tx: {notification.txHash} (View on Sepolia Etherscan)
          </a>
        )}

      </footer>
    )}

    </div>
  );

  //====================================================================================//
}

export default App;