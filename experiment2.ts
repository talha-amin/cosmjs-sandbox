import { IndexedTx, SigningStargateClient, StargateClient } from "@cosmjs/stargate"
import { readFile } from "fs/promises"
import { DirectSecp256k1HdWallet, OfflineDirectSigner } from "@cosmjs/proto-signing"
import { Tx } from "cosmjs-types/cosmos/tx/v1beta1/tx"
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx"

const rpc = "rpc.sentry-01.theta-testnet.polypore.xyz:26657"

const getAliceSignerFromMnemonic = async (): Promise<OfflineDirectSigner> => {
    return DirectSecp256k1HdWallet.fromMnemonic((await readFile("./testnet.alice.mnemonic.key")).toString(), {
        prefix: "cosmos",
    })
}
const runAll = async (): Promise<void> => {
    const client = await StargateClient.connect(rpc)
    console.log("With client, chain id:", await client.getChainId(), ", height:", await client.getHeight())
    console.log(
        "Alice Balances:",
        await client.getAllBalances("cosmos1mjmq7xlqy6njxa9hhvn9qvz075u2fdyshydccy")
    )

    const faucetTxResult = await client.getTx(
        "1CD51B4F2BBF08E9A3A1BC389CEA82EEBFC088C5D6DA4892551D94934F2D2AA8"
    )

    if (faucetTxResult) {
        console.log("Faucet Tx:", faucetTxResult)

        const decodedTx: Tx = Tx.decode(faucetTxResult.tx)
        console.log("DecodedTx:", decodedTx)
        console.log("Decoded messages:", decodedTx.body!.messages)
        const sendMessage: MsgSend = MsgSend.decode(decodedTx.body!.messages[0].value)
        console.log("Sent message:", sendMessage)
        const faucet: string = sendMessage.fromAddress
        console.log("Faucet:", faucet)

        const aliceSigner: OfflineDirectSigner = await getAliceSignerFromMnemonic()
        const alice = (await aliceSigner.getAccounts())[0].address
        console.log("Alice's address from signer", alice)
        const signingClient = await SigningStargateClient.connectWithSigner(rpc, aliceSigner)
        console.log(
            "With signing client, chain id:",
            await signingClient.getChainId(),
            ", height:",
            await signingClient.getHeight()
        )

        console.log("Gas fee:", decodedTx.authInfo!.fee!.amount)
        console.log("Gas limit:", decodedTx.authInfo!.fee!.gasLimit.toString(10))  // Check the balance of Alice and the Faucet
            console.log("Alice balance before:", await client.getAllBalances(alice))
        console.log("Faucet balance before:", await client.getAllBalances(faucet))
        // Execute the sendTokens Tx and store the result
        const result = await signingClient.sendTokens(alice, faucet, [{ denom: "uatom", amount: "100000" }], {
            amount: [{ denom: "uatom", amount: "500" }],
            gas: "200000",
        })
        // Output the result of the Tx
        console.log("Transfer result:", result)
        console.log("Alice balance after:", await client.getAllBalances(alice))
        console.log("Faucet balance after:", await client.getAllBalances(faucet))
    } else {
        console.log("Faucet Tx not found.")
    }
}

runAll()
