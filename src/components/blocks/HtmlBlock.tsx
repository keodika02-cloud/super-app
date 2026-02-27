import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export const HtmlBlock = ({ data }: { data: any }) => {
    const combinedSource = `
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { margin: 0; padding: 16px; font-family: sans-serif; background: transparent; color: #1e293b; }
                    ${data.css || ''}
                </style>
            </head>
            <body>
                ${data.html || ''}
                <script>${data.js || ''}</script>
            </body>
        </html>
    `;

    return (
        <View style={[styles.htmlBlockContainer, { height: data.height || 300 }]}>
            <WebView
                originWhitelist={['*']}
                source={{ html: combinedSource }}
                style={styles.webview}
                scrollEnabled={false}
                transparent={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    htmlBlockContainer: { borderRadius: 16, overflow: 'hidden', marginHorizontal: 0 },
    webview: { flex: 1, backgroundColor: 'transparent' },
});
