import React, { useState } from 'react';
import { Platform, StyleSheet, View, Text, Pressable, Image } from 'react-native';
import WebView from 'react-native-webview';
import { Button } from '../Button';
import EmbedWebsite from './EmbedWebsite';
import stylesheet from "./styles"
import { useStyles } from '../../hooks';
import { Link } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Avatar } from '../Avatar';

interface EmbedWebsiteInterface {
    uri?: string
    title?: string;
    twitter?: string;
    description?: string;
    img?: string;
}
const EmbedCard = ({ uri, title, twitter, description, img }: EmbedWebsiteInterface) => {
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const styles = useStyles(stylesheet)
    const handleOpen = () => {
        setIsOpen(!isOpen)
    }

    const handleGoTo = () => {
        if(uri) {
            Linking.openURL(uri)
        }
    }
    return (

        <View style={styles.container}>

            {img &&
                <Image
                    src={
                        img ?? require('../../assets/degen-logo.png')
                    }
                />
            }


            {title &&
                <Text style={styles.text}>{title}</Text>
            }

            {description &&
                <Text style={styles.text}>{description}</Text>
            }



            <View style={{
                flex:1,
                flexDirection:"row"
            }}>
                {/* <Button onPress={handleGoTo} >Go</Button> */}
                <Button onPress={handleOpen}>Open</Button>
            </View>


            {isOpen &&
                <View style={{ height: 350 }}>
                    <EmbedWebsite uri={uri}></EmbedWebsite>
                </View>
            }


        </View>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default EmbedCard;