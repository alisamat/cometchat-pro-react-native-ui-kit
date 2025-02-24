/* eslint-disable react/no-did-update-set-state */
import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import * as enums from '../../../utils/enums';
import {
  CometChatUserPresence,
  CometChatBadgeCount,
  CometChatAvatar,
} from '../../Shared';

import styles from './styles';
import { View, TouchableOpacity, Text } from 'react-native';
import { Platform } from 'react-native';
import { logger } from '../../../utils/common';
import { CometChatContext } from '../../../utils/CometChatContext';
import formatTurkishDate from '../../FunctionsEmlakisim/formatTurkishDate'
const conversation = 'conversation';
const lastMessage = 'lastMessage';
const deletedAt = 'deletedAt';
const sentAt = 'sentAt';

class CometChatConversationListItem extends React.Component {
  static contextType = CometChatContext;
  constructor(props) {
    super(props);

    this.state = {
      lastMessage: '',
      lastMessageTimestamp: '',
      isThreaded: false,
      restrictions: null,
    };
  }

  componentDidMount() {
    const timestamp = this.getLastMessageTimestamp();

    this.setState({
      lastMessageTimestamp: timestamp,
    });

    this.checkAndMarkAsDelivered();
    this.checkRestrictions();
  }

  checkAndMarkAsDelivered = async () => {
    const {lastMessage} = this.props.conversation;
    if (lastMessage && lastMessage.sender.uid != this.props.loggedInUser.uid &&
        !lastMessage.hasOwnProperty("deliveredAt")) {
          CometChat.markAsDelivered(lastMessage);
    }
  }

  checkRestrictions = async () => {
    let isUnreadCountEnabled = await this.context.FeatureRestriction.isUnreadCountEnabled();
    let isHideDeletedMessagesEnabled = await this.context.FeatureRestriction.isHideDeletedMessagesEnabled();

    this.setState(
      {
        restrictions: { isUnreadCountEnabled, isHideDeletedMessagesEnabled },
      },
      () => {
        const message = this.getLastMessage();
        this.setState({ lastMessage: message || '' });
      },
    );
  };

  componentDidUpdate(prevProps) {
    try {
      const previousItem = JSON.stringify(prevProps.conversation);
      const currentItem = JSON.stringify(this.props.conversation);

      if (previousItem !== currentItem) {
        const message = this.getLastMessage();
        const timestamp = this.getLastMessageTimestamp();

        this.setState({
          lastMessage: message || '',
          lastMessageTimestamp: timestamp,
        });
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Retrieve last message from conversation object
   * @param
   */
  getLastMessage = () => {
    try {
      if (
        Object.prototype.hasOwnProperty.call(this.props, conversation) === false
      ) {
        return false;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          this.props.conversation,
          lastMessage,
        ) === false
      ) {
        return false;
      }

      let message = null;
      const { lastMessage: lastMessageObject } = this.props.conversation;

      if (Object.prototype.hasOwnProperty.call(lastMessageObject, deletedAt)) {
        if (this.state?.restrictions?.isHideDeletedMessagesEnabled) {
          message = '';
        } else {
          message =
            this.props.loggedInUser.uid === lastMessageObject.sender.uid
              ? '⚠ You deleted this message.'
              : '⚠ This message was deleted.';
        }
      } else {
        switch (lastMessageObject.category) {
          case 'message':
            message = this.getMessage(lastMessageObject);
            break;
          case 'call':
            message = this.getCallMessage(lastMessageObject);
            break;
          case 'action':
            message = lastMessageObject.message;
            break;
          case 'custom':
            message = this.getCustomMessage(lastMessageObject);
            break;
          default:
            break;
        }
      }

      return message;
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Retrieve last message timestamp from conversation object
   * @param
   */
  getLastMessageTimestamp = () => {
    try {
      if (
        Object.prototype.hasOwnProperty.call(this.props, conversation) === false
      ) {
        return false;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          this.props.conversation,
          lastMessage,
        ) === false
      ) {
        return false;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          this.props.conversation.lastMessage,
          sentAt,
        ) === false
      ) {
        return false;
      }

      let timestamp = null;

      const messageTimestamp = new Date(
        this.props.conversation.lastMessage.sentAt * 1000,
      );
      const currentTimestamp = Date.now();

      const diffTimestamp = currentTimestamp - messageTimestamp;
// console.log('184',currentTimestamp,messageTimestamp);
      // if (diffTimestamp < 24 * 60 * 60 * 1000) {
      //   timestamp = messageTimestamp.toLocaleTimeString('tr-TR', {
      //     hour: 'numeric',
      //     minute: 'numeric',
      //     hour12: true,
      //   });
      //   if (Platform.OS === 'android' && timestamp !== 'Dün') {
      //     let time = timestamp.split(':'); // convert to array

      //     var hours = Number(time[0]);
      //     var minutes = Number(time[1]?.split(' ')[0]);
      //     var timeValue;

      //     if (hours > 0 && hours <= 12) {
      //       timeValue = '' + hours;
      //     } else if (hours > 12) {
      //       timeValue = '' + (hours - 12);
      //     } else if (hours == 0) {
      //       timeValue = '12';
      //     }

      //     timeValue += minutes < 10 ? ':0' + minutes : ':' + minutes; // get minutes
      //     timeValue += hours >= 12 ? ' PM' : ' AM'; // get AM/PM
      //     timestamp = timeValue;
      //   }
      // } else if (diffTimestamp < 48 * 60 * 60 * 1000) {
      //   timestamp = 'Dün';
      // } else if (diffTimestamp < 7 * 24 * 60 * 60 * 1000) {
      //   timestamp = messageTimestamp.toLocaleDateString('tr-TR', {
      //     year: '2-digit',
      //     month: '2-digit',
      //     day: '2-digit',
      //   });
      // } else {
      //   timestamp = messageTimestamp.toLocaleDateString('tr-TR', {
      //     year: '2-digit',
      //     month: '2-digit',
      //     day: '2-digit',
      //   });
      // }

      // if (diffTimestamp < 60 * 1000) {
      //   timestamp = 'Şimdi';
      // } else if (diffTimestamp < 15 * 60 * 1000) {
      //   const minutesDiff = Math.ceil(diffTimestamp / (60 * 1000));
      //   timestamp = minutesDiff === 1 ? '1 dakika' : `${minutesDiff} dakika`;
      // } else if (diffTimestamp < 24 * 60 * 60 * 1000) {
      //   timestamp = messageTimestamp.toLocaleTimeString('tr-TR', {
      //     hour: '2-digit',
      //     minute: '2-digit',
      //     hour12: false,
      //   });
      // } else if (diffTimestamp < 48 * 60 * 60 * 1000) {
      //   timestamp = 'Dün';
      // } else if (diffTimestamp < 7 * 24 * 60 * 60 * 1000) {
      //   timestamp = messageTimestamp.toLocaleDateString('tr-TR', {
      //     hour: '2-digit',
      //     minute: '2-digit',
      //     year: '2-digit',
      //     month: '2-digit',
      //     day: '2-digit',
      //   });
      // } else {
      //   timestamp = messageTimestamp.toLocaleDateString('tr-TR', {
      //     hour: '2-digit',
      //     minute: '2-digit',
      //     year: '2-digit',
      //     month: '2-digit',
      //     day: '2-digit',
      //   });
      // }
      ///////
      const now = new Date();
const messageDate = messageTimestamp.toLocaleDateString('tr-TR', {
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
});

if (diffTimestamp < 60 * 1000) {
  timestamp = 'Şimdi';
} else if (diffTimestamp < 15 * 60 * 1000) {
  const minutesDiff = Math.ceil(diffTimestamp / (60 * 1000));
  timestamp = minutesDiff === 1 ? '1 dakika' : `${minutesDiff} dakika`;
} else if (diffTimestamp < 24 * 60 * 60 * 1000) {
  timestamp = `${messageTimestamp.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })}`;
} else if (diffTimestamp < 48 * 60 * 60 * 1000) {
  timestamp = 'Dün';
} else if (diffTimestamp < 7 * 24 * 60 * 60 * 1000) {
  timestamp = messageDate;
} else {
  timestamp = messageDate;
}

      ///////
      return timestamp;
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Retrieve last message for messageType - custom
   * @param lastMessage - message object
   */
  getCustomMessage = (lastMessage) => {
    try {
      let message = null;
      switch (lastMessage.type) {
        case enums.CUSTOM_TYPE_POLL:
          message = 'Poll';
          break;
        case enums.CUSTOM_TYPE_STICKER:
          message = 'Sticker';
          break;
        case 'meeting':
          message = 'Video Call';
          break;
        default:
          break;
      }

      return message;
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Retrieve last message for messageType - message
   * @param lastMessage - message object
   */
  getMessage = (lastMessage) => {
    // console.log('3222',lastMessage);
    try {
      let message = null;
      this.setState({ isThreaded: lastMessage.parentMessageId });
      switch (lastMessage.type) {
        case CometChat.MESSAGE_TYPE.TEXT:
          message = lastMessage.text;
          break;
        case CometChat.MESSAGE_TYPE.MEDIA:
          message = 'Media message';
          break;
        case CometChat.MESSAGE_TYPE.IMAGE:
          message = '📷 Image ';
          break;
        case CometChat.MESSAGE_TYPE.FILE:
          message = '📁 File';
          break;
        case CometChat.MESSAGE_TYPE.VIDEO:
          message = '🎥 Video';
          break;
        case CometChat.MESSAGE_TYPE.AUDIO:
          message = '🎵 Audio';
          break;
        case CometChat.MESSAGE_TYPE.CUSTOM:
          message = 'Custom message';
          break;
        default:
          break;
      }

      return message;
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Retrieve last message for messageType - call
   * @param lastMessage - message object
   */
  getCallMessage = (lastMessage) => {
    try {
      let message = null;
      switch (lastMessage.type) {
        case CometChat.MESSAGE_TYPE.VIDEO:
          message = 'Video call';
          break;
        case CometChat.MESSAGE_TYPE.AUDIO:
          message = 'Audio call';
          break;
        default:
          break;
      }

      return message;
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Retrieve avatar from conversation object
   * @param
   */
  getAvatar = () => {
    try {
      let avatar;
      if (this.props.conversation.conversationType === 'user') {
        avatar = { uri: this.props.conversation.conversationWith.avatar };
      } else if (this.props.conversation.conversationType === 'group') {
        avatar = { uri: this.props.conversation.conversationWith.icon };
      }
      return avatar;
    } catch (error) {
      logger(error);
    }
  };
  repplace(){
  var message=this.state.lastMessage
  message = message.replace('joined', 'katıldı');
  message = message.replace('left', 'ayrıldı');
  message = message.replace('added', 'yeni üye ekledi  @');
  return message
  }
  render() {
    let lastMessageTimeStamp = null;
    // console.log('343',this.state.lastMessage);
    if (this.state.lastMessage) {
      lastMessageTimeStamp = (
        <Text style={[styles.itemLastMsgTimeStyle,{ fontWeight: "400" }]} numberOfLines={1}>
          {/* {formatTurkishDate(this.state.lastMessageTimestamp)} */}
          {  this.state.lastMessageTimestamp }        </Text>
      );
    }

    let presence;

    if (this.props.conversation.conversationType === 'user') {
      const { status } = this.props.conversation.conversationWith;
      presence = (
        <CometChatUserPresence
          status={status}
          style={{ top: 30 }}
          cornerRadius={18}
          borderColor={this.props.theme.color.white}
          borderWidth={2}
        />
      );
    }
    return (
      <View key={this.props?.conversation?.conversationId} >
        <TouchableOpacity
          activeOpacity={1}
          underlayColor={this.props.theme.backgroundColor.listUnderlayColor}
          style={[styles.listItem,{ backgroundColor: this.props.select?"#E3F2FD":"white"}]}
          onPress={() =>
            this.props.handleClick(
              this.props.conversation,
              this.props.conversationKey,
            )
          }>
          <View style={[styles.itemThumbnailStyle,{
            width: 50,height: 50,borderRadius: 25
            }]}>
            <CometChatAvatar
              image={this.getAvatar()}
              cornerRadius={25}
              borderColor={this.props.theme.color.secondary}
              borderWidth={1}
              name={this.props.conversation.conversationWith.name}
            />
            {presence}
          </View>
     
          <View
            style={[
              styles.itemDetailsContainer,
              { borderBottomColor: this.props.theme.borderColor.primary,
                backgroundColor: this.props.select?"#E3F2FD":"white"
              },
             
            ]}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                alignItems: 'center',
              }}>
              <Text numberOfLines={1} style={[styles.itemNameStyle,{fontWeight:"600"}]}>
                {this.props.conversation.conversationWith.name}
              </Text>
              <View style={styles.itemLastMsgStyle}>
                {lastMessageTimeStamp}
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                alignItems: 'center',
              }}>
              <Text numberOfLines={1} style={[styles.itemLastMsgTimeStyle,{fontWeight:"400"}]}>
                {`${this.state.isThreaded ? 'Bir mesaj içinde : ' : ''}` +
                  // this.state.lastMessage
                  this.repplace()
                  }
              </Text>

              {this.state.restrictions?.isUnreadCountEnabled ? (
                <CometChatBadgeCount
                  theme={this.props.theme}
                  count={this.props.conversation.unreadMessageCount}
                />
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}
export default CometChatConversationListItem;
