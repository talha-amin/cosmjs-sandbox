import { StargateClient } from "@cosmjs/stargate"

  const rpc = "rpc.sentry-01.theta-testnet.polypore.xyz:26657"
const runAll = async(): Promise<void> => {
    const client = await StargateClient.connect(rpc)
    console.log("With client, chain id:", await client.getChainId(), ", height:", await client.getHeight())
    console.log("Alice Balances:",
    await client.getAllBalances("cosmos1mjmq7xlqy6njxa9hhvn9qvz075u2fdyshydccy"))
}

runAll()