const truffleAssert = require("truffle-assertions");
const XYZCoin = artifacts.require("XYZCoin");

contract("XYZCoin", (accounts) => {
  const [creator, recipient, spender, outsider] = accounts;
  let token;

  beforeEach(async () => {
    token = await XYZCoin.new({ from: creator });
  });

  it("has the required name, symbol, decimals, and total supply", async () => {
    assert.equal(await token.name(), "XYZ Coin");
    assert.equal(await token.symbol(), "XYZ");
    assert.equal((await token.decimals()).toString(), "0");
    assert.equal((await token.totalSupply()).toString(), "1000");
  });

  it("assigns the complete initial supply to the creator", async () => {
    assert.equal((await token.balanceOf(creator)).toString(), "1000");
  });

  it("transfers tokens between accounts", async () => {
    await token.transfer(recipient, 125, { from: creator });
    assert.equal((await token.balanceOf(creator)).toString(), "875");
    assert.equal((await token.balanceOf(recipient)).toString(), "125");
  });

  it("sets and reads an allowance", async () => {
    await token.approve(spender, 80, { from: creator });
    assert.equal((await token.allowance(creator, spender)).toString(), "80");
  });

  it("lets an approved spender call transferFrom", async () => {
    await token.approve(spender, 80, { from: creator });
    await token.transferFrom(creator, recipient, 30, { from: spender });
    assert.equal((await token.balanceOf(recipient)).toString(), "30");
    assert.equal((await token.allowance(creator, spender)).toString(), "50");
  });

  it("reverts a transfer when the sender lacks sufficient balance", async () => {
    await truffleAssert.reverts(
      token.transfer(recipient, 1001, { from: creator }),
      "Insufficient balance"
    );
  });

  it("reverts transferFrom when the caller has no allowance", async () => {
    await truffleAssert.reverts(
      token.transferFrom(creator, recipient, 1, { from: outsider }),
      "Insufficient allowance"
    );
  });

  it("emits Transfer for a normal transfer", async () => {
    const result = await token.transfer(recipient, 10, { from: creator });
    truffleAssert.eventEmitted(result, "Transfer", (event) =>
      event.from === creator && event.to === recipient && event.value.toString() === "10"
    );
  });

  it("emits Transfer even when the transfer value is zero", async () => {
    const result = await token.transfer(recipient, 0, { from: creator });
    truffleAssert.eventEmitted(result, "Transfer", (event) =>
      event.from === creator && event.to === recipient && event.value.toString() === "0"
    );
  });

  it("emits Transfer for transferFrom, including a zero-value transfer", async () => {
    await token.approve(spender, 0, { from: creator });
    const result = await token.transferFrom(creator, recipient, 0, { from: spender });
    truffleAssert.eventEmitted(result, "Transfer", (event) =>
      event.from === creator && event.to === recipient && event.value.toString() === "0"
    );
  });

  it("emits Approval when approve is called", async () => {
    const result = await token.approve(spender, 60, { from: creator });
    truffleAssert.eventEmitted(result, "Approval", (event) =>
      event.owner === creator && event.spender === spender && event.value.toString() === "60"
    );
  });
});
