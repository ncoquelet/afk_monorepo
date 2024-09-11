import '../../../applyGlobalPolyfills';

import { webln } from '@getalby/sdk';
import { useAuth, useCashu, useCashuMintList, useCashuStore, useNostrContext, useSendZap } from 'afk_nostr_sdk';
import * as Clipboard from 'expo-clipboard';
import React, { SetStateAction, useEffect, useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Modal, Text, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import PolyfillCrypto from 'react-native-webview-crypto';

import { Button, IconButton, Input } from '../../components';
import { useStyles, useTheme } from '../../hooks';
import { useDialog, useToast } from '../../hooks/modals';
import stylesheet from './styles';
import { CashuMint, MintQuoteResponse } from '@cashu/cashu-ts';
import { CopyIconStack } from '../../assets/icons';
import { canUseBiometricAuthentication } from 'expo-secure-store';
import { retrieveAndDecryptCashuMnemonic, retrievePassword, storeCashuMnemonic } from '../../utils/storage';
import { SelectedTab, TABS_CASHU } from '../../types/tab';


export const MintListCashu = () => {

  const {

  } = useCashu()
  const { ndkCashuWallet, ndkWallet } = useNostrContext()
  const mintList = useCashuMintList()

  const [mintUrl, setMintUrl] = useState<string | undefined>("https://mint.minibits.cash/Bitcoin")
  const [mint, setMint] = useState<CashuMint | undefined>(mintUrl ? new CashuMint(mintUrl) : undefined)

  const { isSeedCashuStorage, setIsSeedCashuStorage } = useCashuStore()
  const [mintUrls, setMintUrls] = useState<Set<string>>(new Set())
  const getMintUrls = () => {
    const mintsUrlsUnset: string[] = []

    mintList?.data?.pages?.forEach((e) => {
      if(!e?.tags) return;
      e?.tags?.filter((tag: string[]) => {
        if (tag[0] === 'mint') {
          mintsUrlsUnset.push(tag[1])
        }
      });
    })

    const mintsUrls = new Set(mintsUrlsUnset)
    setMintUrls(mintsUrls)
    return mintUrls;
  }
  useEffect(() => {

    // getMintUrls();


  }, []);


  const styles = useStyles(stylesheet);


  const [quote, setQuote] = useState<MintQuoteResponse | undefined>()
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isZapModalVisible, setIsZapModalVisible] = useState(false);
  const [hasSeedCashu, setHasSeedCashu] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionData, setConnectionData] = useState<any>(null);
  const [invoiceMemo, setInvoiceMemo] = useState('');
  const { theme } = useTheme();
  const [newSeed, setNewSeed] = useState<string | undefined>()


  const { showToast } = useToast()


  console.log("mintList",mintList?.data)

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollView}>

        <View style={styles.container}>

          <FlatList

            // contentContainerStyle={styles.flatListContent}
            data={Array.from(mintUrls)}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              return <View>
                <Text> Mint url: {item}</Text>

              </View>
            }}

          />



        </View>

        <View style={styles.container}>

          <FlatList

            // contentContainerStyle={styles.flatListContent}
            data={mintList?.data?.pages?.flat()}
            keyExtractor={(item) => item?.id}
            renderItem={({ item }) => {
              // console.log("item", item)
              const mintsUrlsUnset: string[] = []

              item?.tags?.filter((tag: string[]) => {
                if (tag[0] === 'mint') {
                  mintsUrlsUnset.push(tag[1])
                }
              });

              const mintsUrls = new Set(mintsUrlsUnset)
              // setMintUrls(mintsUrls)
              return <View>
                <Text> Mint event: {item?.pubkey}</Text>
                {Array.from(mintsUrls).map((url) => {
                  return (
                    <View>
                      <Text>Url: {url}</Text>
                    </View>
                  )
                })}


              </View>
            }}
            refreshControl={
              <RefreshControl refreshing={mintList.isFetching} onRefresh={() => mintList.refetch()} />
            }
            onEndReached={() => mintList.fetchNextPage()}
          />



        </View>
      </ScrollView>
    </SafeAreaView>
  );
};