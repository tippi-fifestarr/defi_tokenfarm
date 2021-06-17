import React, { Component } from "react"
import Web3 from "web3"
import Go_dToken from "../abis/Go_dToken.json"
import TokenFarm from "../abis/TokenFarm.json"
import ERC20 from "../abis/ERC20.json"
import Navbar from "./Navbar"
import Main from "./Main"
import "./App.css"
import chainlink from "../chainlink.png"

// class based react vs state hooks method
class App extends Component {
  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async changeToken(address, name, tokenImage) {
    await this.setState({ image: tokenImage })
    await this.setState({ tokenAddress: address })
    await this.setState({ tokenName: name })
    await this.updateBalance(address).then(this.render())
  }

  async updateBalance(address) {
    const web3 = window.web3
    const erc20 = new web3.eth.Contract(ERC20.abi, this.state.tokenAddress)
    await this.setState({ erc20 })
    let erc20Balance = await erc20.methods.balanceOf(this.state.account).call()
    await this.setState({ erc20Balance: erc20Balance.toString() })
    await this.updateStakingBalance()
  }

  async updateStakingBalance() {
    const web3 = window.web3
    const networkId = await web3.eth.net.getId()
    const tokenFarmData = TokenFarm.networks[networkId]
    const tokenFarm = new web3.eth.Contract(
      TokenFarm.abi,
      tokenFarmData.address
    )
    let stakingBalance = await tokenFarm.methods
      .stakingBalance(this.state.tokenAddress, this.state.account)
      .call()
    this.setState({ stakingBalance: stakingBalance.toString() })
  }

  async loadBlockchainData() {
    const web3 = window.web3

    const accounts = await web3.eth.getAccounts()

    //setting state so in main we can get the staking balance; this one is LINK
    this.setState({ account: accounts[0] })
    this.setState({
      tokenAddress: "0xa36085F69e2889c224210F603D836748e7dC0088",
    })
    this.setState({ image: chainlink })
    this.setState({ tokenName: "LINK" })

    const networkId = await web3.eth.net.getId()

    // Load DAI as the starting default Token Data
    // const daiTokenData = DaiToken.networks[networkId];
    const erc20 = new web3.eth.Contract(ERC20.abi, this.state.tokenAddress)
    this.setState({ erc20 })
    let erc20Balance = await erc20.methods.balanceOf(this.state.account).call()
    this.setState({ erc20Balance: erc20Balance.toString() })

    // Load Go_dToken
    const go_dTokenData = Go_dToken.networks[networkId]
    if (go_dTokenData) {
      const go_dToken = new web3.eth.Contract(
        Go_dToken.abi,
        go_dTokenData.address
      )
      this.setState({ go_dTokenAddress: go_dTokenData.address })
      this.setState({ go_dToken })
      let go_dTokenBalance = await go_dToken.methods
        .balanceOf(this.state.account)
        .call()
      this.setState({ go_dTokenBalance: go_dTokenBalance.toString() })
    } else {
      window.alert("Go_dToken contract not deployed to detected network.")
    }

    // Load TokenFarm
    const tokenFarmData = TokenFarm.networks[networkId]
    if (tokenFarmData) {
      const tokenFarm = new web3.eth.Contract(
        TokenFarm.abi,
        tokenFarmData.address
      )
      this.setState({ tokenFarm })
      this.updateStakingBalance()
    } else {
      window.alert("TokenFarm contract not deployed to detected network.")
    }

    this.setState({ loading: false })
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      )
    }
  }

  stakeTokens = (amount, tokenAddress) => {
    this.setState({ loading: true })
    this.state.erc20.methods
      .approve(this.state.tokenFarm._address, amount)
      .send({ from: this.state.account })
      .on("transactionHash", (hash) => {
        this.state.tokenFarm.methods
          .stakeTokens(amount, tokenAddress)
          .send({ from: this.state.account })
          .on("transactionHash", (hash) => {
            this.setState({ loading: false })
          })
      })
  };

  unstakeTokens = (address) => {
    this.setState({ loading: true })
    this.state.tokenFarm.methods
      .unstakeTokens(address)
      .send({ from: this.state.account })
      .on("transactionHash", (hash) => {
        this.setState({ loading: false })
      })
  };

  constructor(props) {
    super(props)
    this.state = {
      account: "0x0",
      erc20: {},
      go_dToken: {},
      go_dTokenAddress: "",
      tokenFarm: {},
      erc20Balance: "0",
      go_dTokenBalance: "0",
      stakingBalance: "0",
      loading: true,
      image: chainlink,
      tokenName: "LINK",
    }
  }

  render() {
    let content
    if (this.state.loading) {
      content = (
        <p id="loader" className="text-center">
          Loading...
        </p>
      )
    } else {
      content = (
        <Main
          erc20Balance={this.state.erc20Balance}
          go_dTokenBalance={this.state.go_dTokenBalance}
          go_dTokenAddress={this.state.go_dTokenAddress}
          stakingBalance={this.state.stakingBalance}
          stakeTokens={this.stakeTokens.bind(this)}
          unstakeTokens={this.unstakeTokens.bind(this)}
          tokenName={this.state.tokenName}
          image={this.state.image}
          tokenAddress={this.state.tokenAddress}
          changeToken={this.changeToken.bind(this)}
          updateBalance={this.updateBalance.bind(this)}
        />
      )
    }

    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main
              role="main"
              className="col-lg-12 ml-auto mr-auto"
              style={{ maxWidth: "600px" }}
            >
              <div className="content mr-auto ml-auto">
                <a
                  href="https://alphachain.io"
                  target="_blank"
                  rel="noopener noreferrer"
                ></a>

                {content}
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }
}

export default App