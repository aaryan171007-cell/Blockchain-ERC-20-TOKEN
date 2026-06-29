# ERC-20 Token & Smart Contract Dashboard : ARX 

This is a full-stack decentralized application (dApp) featuring a custom ERC-20 smart token contract paired with a real-time reactive Web3 dashboard interface. This project is organized as a dual-workspace repository to separate local smart contract environments from the frontend application layer.

---

## 📌Project Overview
This project provides an intuitive Web3 interface enabling users to interact directly with an ERC-20 token smart contract via their web browsers only without writing terminal-based blockchain interaction commands by offering them a real-time token tracking, a secure multi-wallet transfer portal, and dynamic balance analytics built to standard cryptographic specifications.

This smart contract is deployed on sepolia ethereum testnet and one can view it on etherscan too through the contract address provided in the Contract_info.txt file.

---

## ✨ Features Implemented
* **Smart Contract Integration:** Replicated the Remix-IDE features such as minting, transfering, burning etc. features on the react UI itself so that user is not required to jump in the solidity codes and understand what's going on.

* **Web3 Wallet Connection:** Seamless authentication flow and checks for MetaMask and other standard browser-based Web3 providers.

* **Real-Time Token Monitoring:** Updating and tracking the total token supply, circulating balances, and the user's active wallet addresses.

* **Minting Tokens with rewards:** A real-time minting tokens allowing users to mint the ARX tokens directly into their metamask wallets along with the additional minting reward.

* **Burning Tokens:** Enabling users to burn their tokens in order to satisfy the max cap limit and maintaining the value of the token over time.

* **Transfering Tokens:** Enabled seamless and authenticated token transfer on chain so that users can exchange tokens easily over the blockchain environment.

* **Destroying Contract:** This feature is restricted to the owner of the contract only so that if he or she wish, they can destroy their contract thus refraining everyone from accessing the token features and the tokens itself.

* **Token Balance LeaderBoard:** A real-time leaderboard showcasing the details of the top 3 ARX token bearers. This includes their wallet addresses and their token balance.

* **Modern Interface:** A visually appealing dashboard UI built with modern dark-mode light-mode toggle components optimized for desktop viewing.

---

## 🛠️ Technologies Used

### Frontend Dashboard
* **Framework:** React.js (v19.2) via Vite (v8.0)
* **Web3 Interaction:** Ethers.js (v6.16)

### Blockchain / Smart Contracts
* **Smart Contract Framework:** Foundry (Compilation, testing, and deployment environment)
* **Smart Contract Language:** Solidity

---

## 🚀 Setup & Build Instructions

### Prerequisites
To run this project locally, ensure you have the following installed:
* **Node.js:** Modern versions matching `^20.19.0`, `^22.12.0`, or `>=23.0.0` (Required due to Vite 8 architecture specifications).
* **Web3 Wallet:** A Metamask wallet or equivalent installed in your browser.

### Local Installation Steps

1. **Clone the repository:**
```bash
git clone [https://github.com/aaryan171007-cell/Blockchain-ERC-20-TOKEN.git](https://github.com/aaryan171007-cell/Blockchain-ERC-20-TOKEN.git)
cd Blockchain-ERC-20-TOKEN

2. **Navigate into the frontend folder and install dependencies:**
```bash
cd Frontend
npm install

3. **Launch the local development server:**
```bash
npm run dev

The application will boot up immediately. Open your browser and navigate to http://localhost:5173.

## ⚠️ Known Issues & Future Work

* **Testnet Shift Refresh:** The current frontend iteration does not automatically refresh its state if a user changes their active network chain inside MetaMask (e.g., shifting from a testnet to another chain) without a manual browser page reload 


