const Go_dToken = artifacts.require('Go_dToken')

module.exports = async function(deployer, network, accounts) {
    await deployer.deploy(Go_dToken)
    const go_dToken = await Go_dToken.deployed()
    console.log(go_dToken.address)
}