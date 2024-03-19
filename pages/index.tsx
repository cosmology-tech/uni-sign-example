import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Window as KeplrWindow } from "@keplr-wallet/types";
import { Message, TxRaw } from "@uni-sign/cosmos/types";
import { getPrefix, toConverter, toEncoder } from "@uni-sign/cosmos/utils";
import { AminoSigner } from "@uni-sign/cosmos/amino";
import { MsgSend } from "@uni-sign/cosmos-msgs/cosmos/bank/v1beta1/tx";
import { toWallet } from "../utils/amino";
import { toHex } from "@uni-sign/utils";

const CHAIN_ID = "cosmoshub-4";
const RPC = "https://rpc.cosmos.directory/cosmoshub";
const encodes = [toEncoder(MsgSend)];
const converters = [toConverter(MsgSend)];

export default () => {
  const [signer, setSigner] = useState<AminoSigner>();
  const [signature, setSignature] = useState<string>("signature printed here");
  const [txHash, setTxHash] = useState<string>("tx hash printed here");
  const [response, setResponse] = useState<string>(
    "broadcast response printed here"
  );

  const messages: Message<MsgSend>[] = useMemo(() => {
    const address = signer?.publicKeyHash.toBech32(getPrefix(CHAIN_ID)) ?? "";
    return [
      {
        typeUrl: MsgSend.typeUrl,
        value: {
          amount: [
            {
              amount: "100",
              denom: "uatom",
            },
          ],
          fromAddress: address,
          toAddress: address,
        },
      },
    ];
  }, [signer]);

  const sign = useCallback(async () => {
    if (!signer) {
      throw new Error("Signer is not instantiated yet");
    }
    const { signature, txRaw } = await signer.sign(messages);
    console.log(
      "%cpages/index.tsx:44 signature",
      "color: #007acc;",
      signature.toBase64()
    );
    setSignature(signature.toBase64());
    setTxHash(toHex(signer.config.message.hash(TxRaw.encode(txRaw).finish())));
  }, [messages]);

  const broadcast = useCallback(async () => {
    if (!signer) {
      throw new Error("Signer is not instantiated yet");
    }
    const resp = await signer.signAndBroadcast(messages);
    console.log("%cpages/index.tsx:38 resp", "color: #007acc;", resp);
    setResponse(JSON.stringify(resp, undefined, 4));
  }, [messages]);

  useEffect(() => {
    const offlineSigner = (window as KeplrWindow).keplr!.getOfflineSignerOnlyAmino(
      CHAIN_ID
    );
    // const offlineSigner = (window as any).cosmostation.providers.keplr.getOfflineSignerOnlyAmino(
    //   CHAIN_ID
    // );
    // const offlineSigner = (window as any).leap.getOfflineSignerOnlyAmino(
    //   CHAIN_ID
    // );
    const fn = async () => {
      const signer = await AminoSigner.fromWallet(
        toWallet(offlineSigner, CHAIN_ID),
        encodes,
        converters,
        RPC
      );
      setSigner(signer);
    };
    fn();
  }, []);

  return (
    <div>
      <h3>
        Connect wallet to sign and broadcast message "Send 100 Tokens to Self"
      </h3>
      <div>
        <button onClick={sign}>Sign</button>
        <p />
        <textarea cols={100} rows={3} value={signature} readOnly />
        <textarea cols={100} rows={3} value={txHash} readOnly />
      </div>
      <p />
      <div>
        <button onClick={broadcast}>Broadcast</button>
        <p />
        <textarea cols={100} rows={30} value={response} readOnly />
      </div>
    </div>
  );
};
