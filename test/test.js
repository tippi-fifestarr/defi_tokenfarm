const Go_dToken = artifacts.require("Go_dToken");
const TokenFarm = artifacts.require("TokenFarm");
const { LinkToken } = require("@chainlink/contracts/truffle/v0.4/LinkToken");

require("chai")
  .use(require("chai-as-promised"))
  .should();

function tokens(n) {
  return web3.utils.toWei(n, "ether");
}

contract("TokenFarm", ([owner, investor]) => {
  let go_dToken, tokenFarm, linkToken;

  before(async () => {
    // Load Contracts
    go_dToken = await Go_dToken.new();
    tokenFarm = await TokenFarm.new(go_dToken.address);
    // linkToken = await LinkToken.new()

    // Transfer all go_d tokens to farm (1 million)
    await go_dToken.transfer(tokenFarm.address, tokens("1000000"));
  });

  describe("go_d token deployment", async () => {
    it("has a name", async () => {
      const name = await go_dToken.name();
      assert.equal(name, "Go_d for Game");
    });
  });

  describe("Token Farm deployment", async () => {
    it("has a name", async () => {
      const name = await tokenFarm.name();
      assert.equal(name, "Go_d Token Farm");
    });

    it("contract has tokens", async () => {
      let balance = await go_dToken.balanceOf(tokenFarm.address);
      assert.equal(balance.toString(), tokens("1000000"));
    });
  });

  // Broken
//   describe("Farming tokens", async () => {
//     it("rewards investors for staking mDai tokens", async () => {
//       let result, starting_balance, ending_balance;

//       // // Check investor balance before staking
//       // startingBalanceDappToken = await dappToken.balanceOf(investor);
//       // startingBalanceLinkToken = await linkToken.balanceOf(investor);
//       // assert.equal(
//       //   startingBalanceDappToken.toString(),
//       //   tokens("0"),
//       //   "investor Dapp wallet starts at 0"
//       // );

//       // await linkToken.approve(tokenFarm.address, tokens("3"), {
//       //   from: investor,
//       // });
//       // await tokenFarm.stakeTokens(tokens("100"), { from: investor });

//       // Please write tests
//     });
//   });
});