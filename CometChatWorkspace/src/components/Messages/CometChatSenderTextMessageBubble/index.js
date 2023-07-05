import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  View,
  Text,
  Image,
  Linking,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import theme from '../../../resources/theme';
import Autolink from 'react-native-autolink';
import CometChatThreadedMessageReplyCount from '../CometChatThreadedMessageReplyCount';
import CometChatReadReceipt from '../CometChatReadReceipt';
import style from './styles';
import { CometChatMessageReactions } from '../Extensions';
import * as enums from '../../../utils/enums';
import * as actions from '../../../utils/actions';
import { CometChatContext } from '../../../utils/CometChatContext';

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const CometChatSenderTextMessageBubble = (props) => {
  // console.log('4533',props);
  const [message, setMessage] = useState({
    ...props.message,
    messageFrom: enums.MESSAGE_FROM_SENDER,
  });
  const prevMessage = usePrevious(message);
  const viewTheme = { ...theme, ...props.theme };
  const context = useContext(CometChatContext);
  useEffect(() => {
    checkRestrictions();
  }, []);
  
  const [restrictions, setRestrictions] = useState(null);

  const checkRestrictions = async () => {
    let isLinkPreviewEnabled = context.FeatureRestriction.isLinkPreviewEnabled();
    setRestrictions({ isLinkPreviewEnabled });
  };

  /**
   * Handler that parses text and wraps URLs, phone numbers, emails, social handles, hashtags, and more with Text nodes and onPress handlers.
   * @param
   */

  const getMessageText = () => {
    // console.log('53215',message.text);
    return (
      <Autolink
        text={message.text}
        style={style.autoLinkStyle}
        textProps={{ selectable: true }}
        linkProps={{ suppressHighlighting: true }}
        linkStyle={style.linkStyle}
      />
    );
  };
  useEffect(() => {
      const previousMessageStr = JSON.stringify(prevMessage);
      const currentMessageStr = JSON.stringify(props.message);

      if (previousMessageStr !== currentMessageStr) {
        const newMessage = {
          ...props.message,
          messageFrom: enums.MESSAGE_FROM_SENDER,
        };
        setMessage(newMessage);
      }
  }, [props]);
  
  let messageText = getMessageText();
  // console.log('78',messageText);
  if (Object.prototype.hasOwnProperty.call(message, 'metadata')) {
    const { metadata } = message;
    const injectedObject = metadata['@injected'];
    if (
      injectedObject &&
      Object.prototype.hasOwnProperty.call(injectedObject, 'extensions')
    ) {
      const extensionsObject = injectedObject.extensions;
      if (
        extensionsObject &&
        Object.prototype.hasOwnProperty.call(extensionsObject, 'link-preview')
      ) {
        const linkPreviewObject = extensionsObject['link-preview'];
        if (
          linkPreviewObject &&
          Object.prototype.hasOwnProperty.call(linkPreviewObject, 'links') &&
          linkPreviewObject.links.length &&
          restrictions?.isLinkPreviewEnabled
        ) {
          const linkObject = linkPreviewObject.links[0];

          const pattern = /(http:|https:)?\/\/(www\.)?(youtube.com|youtu.be)(\S+)?/;
          const linkText = linkObject.url.match(pattern)
            ? 'View on Youtube'
            : 'Visit';
          messageText = (
            <View
              style={[
                style.messagePreviewContainerStyle,
                { backgroundColor: viewTheme.backgroundColor.white },
              ]}>
              <View style={style.messagePreviewWrapperStyle}>
                <Image
                  style={
                    linkObject.image
                      ? style.previewImageStyle
                      : style.previewImageIconStyle
                  }
                  source={{
                    uri: linkObject.image
                      ? linkObject.image
                      : linkObject.favicon,
                  }}
                  resizeMode="contain"
                />
                <View
                  style={[
                    style.previewDataStyle,
                    { borderColor: viewTheme.borderColor.primary },
                  ]}>
                  {linkObject.title ? (
                    <View style={style.previewTitleStyle}>
                      <Text
                        style={[
                          style.linkTitle,
                          {
                            color: viewTheme.color.helpText,
                          },
                        ]}>
                        {linkObject.title}
                      </Text>
                    </View>
                  ) : null}
                  {linkObject.description ? (
                    <View style={style.previewDescStyle}>
                      <Text
                        style={[
                          style.linkDescription,
                          {
                            color: viewTheme.color.helpText,
                          },
                        ]}>
                        {linkObject.description}
                      </Text>
                    </View>
                  ) : null}
                  <View style={style.previewTextStyle}>
                    <Autolink
                      text={message.text}
                      style={[
                        style.previewAutoLinkStyle,
                        {
                          color: viewTheme.color.helpText,
                        },
                      ]}
                      textProps={{ selectable: true }}
                      linkProps={{ suppressHighlighting: true }}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={style.previewLinkStyle}
                  onPress={() => Linking.openURL(linkObject.url)}>
                  <Text
                    style={[
                      style.linkTextStyle,
                      { color: viewTheme.color.blue },
                    ]}>
                    {linkText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }
      }
    }
  }

  return (
    <View style={[style.container,{backgroundColor:props.selectedtextmessage?.id==message.id?"#E1F5FE":"white"}]}>
      <TouchableWithoutFeedback
        onPress={()=>{
          console.log('1922',props)
          console.log('45678',message);
          if(props.selectedtextmessage?.id==message.id){
            props.actionGenerated(actions.SELECTED_MESSAGE, []);

          }else{
          props.actionGenerated(actions.SELECTED_MESSAGE, message);
        }
        }}
        onLongPress={() => {
          console.log('3333',messageText);
          props.actionGenerated(actions.OPEN_MESSAGE_ACTIONS, message);
        }}>
        <View style={[style.messageWrapperStyle,{backgroundColor:"#90EE90"}]}>{messageText}</View>
      </TouchableWithoutFeedback>
      {/* <View style={[style.messageInfoWrapperStyle,{}]}> */}
      <View style={[{flexDirection: "row",
    alignItems: "center",    
    justifyContent: "flex-end"
  }]}>
    <View style={{paddingRight:4}}>
      <CometChatMessageReactions
        showMessage={props.showMessage}
        theme={props.theme}
        {...props}
        message={message}
      />
      </View>
        <View>
        <CometChatThreadedMessageReplyCount
          theme={props.theme}
          {...props}
          message={message}
        />
        <CometChatReadReceipt
          theme={props.theme}
          {...props}
          message={message}
        />
        </View>
       
      </View>
     
    </View>
  );
};
export default CometChatSenderTextMessageBubble;
