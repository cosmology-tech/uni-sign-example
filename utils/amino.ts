import { OfflineAminoSigner } from "@keplr-wallet/types";
import { AminoWallet, StdSignDoc } from "@uni-sign/cosmos/types";
import { Key } from "@uni-sign/utils";

export function toWallet(offlineSigner: OfflineAminoSigner, chainId: string): AminoWallet {
    const wallet: AminoWallet = {
        getAccount: async () => {
          const [account, ..._] = await offlineSigner.getAccounts();
          return {
            algo: account.algo,
            publicKey: Key.from(account.pubkey),
            getAddress(_chainId?: string) {
              if (_chainId === chainId) {
                return account.address;
              }
              throw new Error(`Cannot get address of chain ${_chainId}`);
            },
          };
        },
        sign: async (doc: StdSignDoc) => {
          const [account, ..._] = await offlineSigner.getAccounts();
          const { signature, signed } = await offlineSigner.signAmino(
            account.address,
            doc
          );
          return {
            signature: Key.fromBase64(signature.signature),
            signed: signed as any,
          };
        },
      };
      return wallet
}