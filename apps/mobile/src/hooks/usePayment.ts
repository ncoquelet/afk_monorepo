/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CashuMint, getDecodedToken, getEncodedToken, MintQuoteState, Proof, Token } from '@cashu/cashu-ts';
import {
  EventMarker,
  ICashuInvoice,
  storeProofsSpent,
  useAuth,
  useCreateSpendingEvent,
  useCreateTokenEvent,
  useDeleteTokenEvents,
} from 'afk_nostr_sdk';
import { useState } from 'react';

import { useCashuContext } from '../providers/CashuProvider';
import { useToast } from './modals';
import { useGetTokensByProofs } from './useGetTokensByProof';
import { useProofsStorage, useTransactionsStorage, useWalletIdStorage } from './useStorageState';

export const usePayment = () => {
  const { showToast } = useToast();

  const { meltTokens, wallet, proofs, setProofs, activeUnit, activeMint, mintUrlSelected, connectCashWallet } = useCashuContext()!;
  const { publicKey, privateKey } = useAuth();

  const { value: proofsStorage, setValue: setProofsStorage } = useProofsStorage();
  const { value: transactions, setValue: setTransactions } = useTransactionsStorage();
  const { value: walletId } = useWalletIdStorage();

  const { mutateAsync: createTokenEvent } = useCreateTokenEvent();
  const { mutateAsync: createSpendingEvent } = useCreateSpendingEvent();
  const { deleteMultiple } = useDeleteTokenEvents();

  const [proofsFilter, setProofsFilter] = useState<Proof[]>([]);

  const { refetch: refetchTokens, events: filteredTokenEvents } = useGetTokensByProofs(proofsFilter);

  const handlePayInvoice = async (pInvoice: string) => {
    if (!wallet) {
      console.log('no wallet');

      const cashuMint = new CashuMint(mintUrlSelected)
      const wallet = await connectCashWallet(cashuMint)
      return {
        meltResponse: undefined,
        invoice: undefined,
      };
    }

    if (proofs && proofs.length > 0) {

      try {
        console.log('proofs', proofs);

        // const amount = Number(pInvoice.match(/lnbc(\d+)n/)?.[1] ?? 0);
        // const amount = Number(1);
        // console.log('amount regex', amount);

        // const res = await wallet.selectProofsToSend(proofs, amount)
        // console.log("res", res) 
        const response = await meltTokens(pInvoice, proofs);
        console.log('response', response);
        // const res = await wallet.selectProofsToSend(proofs, response?.meltQuote.amount)

        // const { keep: proofsToKeep, send: proofsToSend } = await wallet.send(response?.meltQuote.amount, res?.send);
        if (response) {
          const { meltQuote, meltResponse, proofsToKeep, remainingProofs, selectedProofs } = response;
          setProofsFilter(selectedProofs);
          if (privateKey && publicKey) {
            await refetchTokens();
            await deleteMultiple(
              filteredTokenEvents.map((event) => event.id),
              'proofs spent in transaction',
            );
            const tokenEvent = await createTokenEvent({
              walletId,
              mint: activeMint,
              proofs: proofsToKeep,
            });
            const destroyedEvents = filteredTokenEvents.map((event) => ({
              id: event.id,
              marker: 'destroyed' as EventMarker,
            }));
            await createSpendingEvent({
              walletId,
              direction: 'out',
              amount: (meltQuote.amount + meltQuote.fee_reserve).toString(),
              unit: activeUnit,
              events: [...destroyedEvents, { id: tokenEvent.id, marker: 'created' as EventMarker }],
            });
          }
          showToast({
            title: 'Payment sent.',
            type: 'success',
          });
          setProofs([...remainingProofs, ...proofsToKeep]);
          setProofsStorage([...remainingProofs, ...proofsToKeep]);
          // Stored proofs spent
          storeProofsSpent([...(meltResponse?.change as Proof[])]);
          const newInvoice: ICashuInvoice = {
            amount: -(meltQuote.amount + meltQuote.fee_reserve),
            bolt11: pInvoice,
            quote: meltQuote.quote,
            date: Date.now(),
            state: MintQuoteState.PAID,
            direction: 'out',
          };
          setTransactions([...transactions, newInvoice]);
          return { meltResponse, invoice: newInvoice };
        } else {
          return { meltResponse: undefined, invoice: undefined };
        }
      } catch (error) {
        console.log('error', error);
        return { meltResponse: undefined, invoice: undefined };
      }
    } else {
      console.log('no proofs');
      // no proofs = no balance
      return {
        meltResponse: undefined,
        invoice: undefined,
      };
    }
  };

  const handleGenerateEcash = async (amount: number) => {
    try {
      if (!amount) {
        return undefined;
      }

      if (!wallet) {
        return undefined;
      }

      if (proofs) {
        const proofsCopy = Array.from(proofs);

        const availableAmount = proofsCopy.reduce((s, t) => (s += t.amount), 0);

        if (availableAmount < amount) {
          return undefined;
        }

        //selectProofs
        const selectedProofs: Proof[] = [];
        const remainingProofs: Proof[] = [];
        let proofsAmount = 0;
        for (let i = 0; i < proofsCopy.length; i++) {
          if (proofsAmount >= amount) {
            remainingProofs.push(proofsCopy[i]);
          } else {
            selectedProofs.push(proofsCopy[i]);
            proofsAmount += proofsCopy[i].amount;
          }
        }

        const res = await wallet.selectProofsToSend(proofs, amount)

        console.log('res', res);
        // const { keep: proofsToKeep, send: proofsToSend } = await wallet.send(amount, selectedProofs);
        const { keep: proofsToKeep, send: proofsToSend } = await wallet.send(amount, res?.send);
        console.log('proofsToKeep', proofsToKeep);

        if (proofsToKeep && proofsToSend) {
          if (privateKey && publicKey) {
            await refetchTokens();
            await deleteMultiple(
              filteredTokenEvents.map((event) => event.id),
              'proofs spent in transaction',
            );
            const tokenEvent = await createTokenEvent({
              walletId,
              mint: activeMint,
              proofs: proofsToKeep,
            });
            const destroyedEvents = filteredTokenEvents.map((event) => ({
              id: event.id,
              marker: 'destroyed' as EventMarker,
            }));
            await createSpendingEvent({
              walletId,
              direction: 'out',
              amount: amount.toString(),
              unit: activeUnit,
              events: [...destroyedEvents, { id: tokenEvent.id, marker: 'created' as EventMarker }],
            });
          }
          setProofs([...remainingProofs, ...proofsToKeep]);
          setProofsStorage([...remainingProofs, ...proofsToKeep]);

          // Stored proofs spent
          storeProofsSpent([...(res?.send as Proof[])]);


          const token = {
            mint: activeMint,
            proofs: proofsToSend,
            activeUnit,
          } as Token;

          const cashuToken = getEncodedToken(token);

          if (cashuToken) {
            const newInvoice: ICashuInvoice = {
              amount: -amount,
              date: Date.now(),
              state: MintQuoteState.PAID,
              direction: 'out',
              bolt11: cashuToken,
            };
            setTransactions([...transactions, newInvoice]);
            return cashuToken;
          } else {
            return undefined;
          }
        }
        return undefined;
      }

      return undefined;
    } catch (e) {
      return undefined;
    }
  };

  const handleReceiveEcash = async (ecashToken?: string) => {
    try {
      console.log('handleReceiveEcash', ecashToken);
      if (!ecashToken) {
        return undefined;
      }
      const decodedToken = getDecodedToken(ecashToken);
      console.log('decodedToken', decodedToken);
      console.log('wallet', wallet);
      const receiveEcashProofs = await wallet?.receive(decodedToken);
      console.log('receiveEcashProofs', receiveEcashProofs);
      if (receiveEcashProofs?.length > 0) {
        const proofsAmount = receiveEcashProofs.reduce((acc, item) => acc + item.amount, 0);
        if (privateKey && publicKey) {
          const tokenEvent = await createTokenEvent({
            walletId,
            mint: activeMint,
            proofs: receiveEcashProofs,
          });

          await createSpendingEvent({
            walletId,
            direction: 'in',
            amount: proofsAmount.toString(),
            unit: activeUnit,
            events: [{ id: tokenEvent.id, marker: 'created' }],
          });
        }

        showToast({ title: 'Ecash received.', type: 'success' });
        setProofs([...proofs, ...receiveEcashProofs]);
        setProofsStorage([...proofsStorage, ...receiveEcashProofs]);

        const newTx: ICashuInvoice = {
          amount: proofsAmount,
          date: Date.now(),
          state: MintQuoteState.PAID,
          direction: 'in',
          bolt11: ecashToken,
        };
        setTransactions([...transactions, newTx]);
        return newTx;
      }
      return undefined;
    } catch (e) {
      console.log('handleReceiveEcash error', e);
      return undefined;
    }
  };

  return {
    handlePayInvoice,
    handleGenerateEcash,
    handleReceiveEcash,
  };
};
