/* eslint-disable react/no-unused-state */
/* eslint-disable no-shadow */
import React from 'react';
import { View, Text,SafeAreaView,Image, FlatList,StyleSheet } from 'react-native';
import { CometChat } from '@cometchat-pro/react-native-chat';

import { CometChatManager } from '../../../utils/controller';
import { MessageListManager } from './controller';

import * as enums from '../../../utils/enums';
import * as actions from '../../../utils/actions';
import CometChatSenderPollMessageBubble from '../Extensions/CometChatSenderPollMessageBubble';
import CometChatSenderStickerMessageBubble from '../Extensions/CometChatSenderStickerMessageBubble';
import CometChatReceiverPollMessageBubble from '../Extensions/CometChatReceiverPollMessageBubble';
import CometChatReceiverStickerMessageBubble from '../Extensions/CometChatReceiverStickerMessageBubble';
import CometChatActionMessageBubble from '../CometChatActionMessageBubble';
import CometChatDeleteMessageBubble from '../CometChatDeleteMessageBubble';
import CometChatReceiverVideoMessageBubble from '../CometChatReceiverVideoMessageBubble';
import CometChatSenderVideoMessageBubble from '../CometChatSenderVideoMessageBubble';
import CometChatSenderFileMessageBubble from '../CometChatSenderFileMessageBubble';
import CometChatReceiverFileMessageBubble from '../CometChatReceiverFileMessageBubble';
import CometChatSenderAudioMessageBubble from '../CometChatSenderAudioMessageBubble';
import CometChatReceiverAudioMessageBubble from '../CometChatReceiverAudioMessageBubble';
import CometChatReceiverImageMessageBubble from '../CometChatReceiverImageMessageBubble';
import CometChatSenderTextMessageBubble from '../CometChatSenderTextMessageBubble';
import CometChatSenderImageMessageBubble from '../CometChatSenderImageMessageBubble';
import CometChatReceiverTextMessageBubble from '../CometChatReceiverTextMessageBubble';
import CometChatReceiverDirectCallBubble from '../CometChatReceiverDirectCallBubble';
import CometChatSenderDirectCallBubble from '../CometChatSenderDirectCallBubble';
import {
  CometChatIncomingCall,
  CometChatOutgoingCall,
  CometChatOutgoingDirectCall,
  CometChatIncomingDirectCall,
} from '../../Calls';
import styles from './styles';
import { logger } from '../../../utils/common';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import { CometChatContext } from '../../../utils/CometChatContext';
// import PinnedMessages from '../../../../../../Components/cometchatComp/pincomponenet';
import constants from '../../../../../../Util/Constants';
import  assets  from '../../../../../../assets/index';


let cDate = null;

class CometChatMessageList extends React.PureComponent {
  loggedInUser = null;

  lastScrollTop = 0;

  times = 0;

  decoratorMessage = 'Yükleniyor...';
  static contextType = CometChatContext;

  constructor(props) {
    super(props);
    this.state = {
      onItemClick: null,
      pinmessage:[],
      pinadd:0
    };

    this.loggedInUser = props.loggedInUser;
    this.flatListRef = React.createRef();
  }

  componentDidMount() {
    if (this.props.parentMessageId) {
      this.MessageListManager = new MessageListManager(
        this.props.item,
        this.props.type,
        this.props.parentMessageId,
        this.context,
      );
    } else {
      this.MessageListManager = new MessageListManager(
        this.props.item,
        this.props.type,
        null,
        this.context,
      );
    }

    this.getMessages();
    this.MessageListManager.attachListeners(this.messageUpdated);
    this.pinGet()
  }

  componentDidUpdate(prevProps) {
    try {
      const previousMessageStr = JSON.stringify(prevProps.messages);
      const currentMessageStr = JSON.stringify(this.props.messages);

      if (
        this.props.type === CometChat.RECEIVER_TYPE.USER &&
        prevProps.item.uid !== this.props.item.uid
      ) {
        this.decoratorMessage = 'Yükleniyor...';
        this.MessageListManager?.removeListeners();

        if (this.props.parentMessageId) {
          this.MessageListManager = new MessageListManager(
            this.props.item,
            this.props.type,
            this.props.parentMessageId,
            this.context,
          );
        } else {
          this.MessageListManager = new MessageListManager(
            this.props.item,
            this.props.type,
            null,
            this.context,
          );
        }
        // this.pinGet()

        this.getMessages();
        this.MessageListManager.attachListeners(this.messageUpdated);
      } else if (
        this.props.type === CometChat.RECEIVER_TYPE.GROUP &&
        prevProps.item.guid !== this.props.item.guid
      ) {
        this.decoratorMessage = 'Yükleniyor...';
        this.MessageListManager?.removeListeners();

        if (this.props.parentMessageId) {
          this.MessageListManager = new MessageListManager(
            this.props.item,
            this.props.type,
            this.props.parentMessageId,
          );
        } else {
          this.MessageListManager = new MessageListManager(
            this.props.item,
            this.props.type,
          );
        }

        this.getMessages();
        this.MessageListManager.attachListeners(this.messageUpdated);
      } else if (prevProps.parentMessageId !== this.props.parentMessageId) {
        this.decoratorMessage = 'Yükleniyor...';
        this.MessageListManager?.removeListeners();
        this.MessageListManager = new MessageListManager(
          this.props.item,
          this.props.type,
          this.props.parentMessageId,
        );
        this.getMessages();
        this.MessageListManager.attachListeners(this.messageUpdated);
      }
    } catch (error) {
      logger(error);
    }
  }

  componentWillUnmount() {
    this.MessageListManager?.removeListeners();
    this.MessageListManager = null;
  }

  /**
   * handler for fetching messages for logged in user and previous conversations.
   * @param scrollToBottom: Event(boolean)
   */
  getMessages = (scrollToBottom = false) => {
    //getMessages() here...
    const actionMessages = [];
    new CometChatManager()
      .getLoggedInUser()
      .then((user) => {
        this.MessageListManager.fetchPreviousMessages()
          .then((messageList) => {
            if (messageList.length === 0) {
              this.decoratorMessage = 'Mesaj bulunamadı';
            }

            messageList.forEach((message) => {
              if (
                message.category === 'action' &&
                message.sender.uid === 'app_system'
              ) {
                actionMessages.push(message);
              }
              this.markMessageAsDelivered(message);

              // if the sender of the message is not the logged in user, mark it as read.
              if (
                message.getSender().getUid() !== user.getUid() &&
                !message.getReadAt()
              ) {
                  CometChat.markAsRead(message);
              }
              this.props.actionGenerated(actions.MESSAGE_READ, message);
            });

            let actionGenerated = actions.MESSAGE_FETCHED;
            if (scrollToBottom === true) {
              actionGenerated = actions.MESSAGE_FETCHED_AGAIN;
            }

            ++this.times;

            if (
              (this.times === 1 && actionMessages.length > 5) ||
              (this.times > 1 && actionMessages.length === 30)
            ) {
              this.props.actionGenerated(actions.MESSAGE_FETCHED, messageList);
              this.getMessages(true);
            } else {
              this.props.actionGenerated(actionGenerated, messageList);
            }
          })
          .catch((error) => {
            this.decoratorMessage = 'Error';
            logger(
              '[CometChatMessageList] getMessages fetchPrevious error',
              error,
            );
          });
      })
      .catch((error) => {
        this.decoratorMessage = 'Error';
        logger(
          '[CometChatMessageList] getMessages getLoggedInUser error',
          error,
        );
      });
  };

  markMessageAsDelivered = (message) => {
    try {
      if (
        message.sender?.uid !== this.loggedInUser?.uid &&
        message.hasOwnProperty('deliveredAt') === false
      ) {
        CometChat.markAsDelivered(message);
      }
    } catch (error) {
      logger(
        '[CometChatMessageList markMessageAsDelivered] faailed to mark as deivered =',
        message,
      );
    }
  };

  // callback for listener functions
  messageUpdated = (key, message, group, options, actionBy) => {
    switch (key) {
      case enums.MESSAGE_DELETED:
        this.messageDeleted(message);
        break;
      case enums.MESSAGE_EDITED:
        this.messageEdited(message);
        break;
      case enums.MESSAGE_DELIVERED:
      case enums.MESSAGE_READ:
        this.messageReadAndDelivered(message);
        break;
      case enums.TEXT_MESSAGE_RECEIVED:
      case enums.MEDIA_MESSAGE_RECEIVED:
        this.newMsgComponent();
        this.messageReceived(message);
        break;
      case enums.CUSTOM_MESSAGE_RECEIVED:
        this.customMessageReceived(message);
        break;
      case enums.GROUP_MEMBER_SCOPE_CHANGED:
      case enums.GROUP_MEMBER_JOINED:
      case enums.GROUP_MEMBER_LEFT:
        this.groupUpdated(key, message, group, options);
        this.messageReceived(message);
        break;
      case enums.GROUP_MEMBER_ADDED:
      case enums.GROUP_MEMBER_KICKED:
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_UNBANNED:
        if (this.loggedInUser.uid !== actionBy.uid)
          this.groupUpdated(key, message, group, options);
          this.messageReceived(message);
        break;
      case enums.INCOMING_CALL_RECEIVED:
      case enums.INCOMING_CALL_CANCELLED:
      case enums.OUTGOING_CALL_ACCEPTED:
      case enums.OUTGOING_CALL_REJECTED:
        this.callUpdated(message);
        break;

      case enums.TRANSIENT_MESSAGE_RECEIVED:
        this.props.actionGenerated(enums.TRANSIENT_MESSAGE_RECEIVED, message);
        break;
        default:
        break;
    }
  };

  /**
   * handler for message deleted by logged in user and updations for groups/user.
   * @param message: message object
   */

  messageDeleted = (message) => {
    if (
      this.props.type === CometChat.RECEIVER_TYPE.GROUP &&
      message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP &&
      message.getReceiver().guid === this.props.item.guid
    ) {
      this.props.actionGenerated(actions.MESSAGE_DELETED, [message]);
    } else if (
      this.props.type === CometChat.RECEIVER_TYPE.USER &&
      message.getReceiverType() === CometChat.RECEIVER_TYPE.USER &&
      message.getSender().uid === this.props.item.uid
    ) {
      this.props.actionGenerated(actions.MESSAGE_DELETED, [message]);
    }
  };

  /**
   * handler for when the message is edited by the logged in user.
   * @param message: message object
   */
  messageEdited = (message) => {
    try {
      const messageList = [...this.props.messages];
      const updateEditedMessage = (message) => {
        const messageKey = messageList.findIndex((m) => m.id === message.id);
        if (messageKey > -1) {
          const messageObj = messageList[messageKey];
          const newMessageObj = { ...messageObj, ...message };

          messageList.splice(messageKey, 1, newMessageObj);
          this.props.actionGenerated(actions.MESSAGE_UPDATED, messageList);
        }
      };

      if (
        this.props.type === CometChat.RECEIVER_TYPE.GROUP &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP &&
        message.getReceiver().guid === this.props.item.guid
      ) {
        updateEditedMessage(message);
      } else if (
        this.props.type === CometChat.RECEIVER_TYPE.USER &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.USER &&
        this.loggedInUser.uid === message.getReceiverId() &&
        message.getSender().uid === this.props.item.uid
      ) {
        updateEditedMessage(message);
      } else if (
        this.props.type === CometChat.RECEIVER_TYPE.USER &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.USER &&
        this.loggedInUser.uid === message.getSender().uid &&
        message.getReceiverId() === this.props.item.uid
      ) {
        updateEditedMessage(message);
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handler for updating messageList via newMessageObj
   * @param message:message object
   */

  updateEditedMessage = (message) => {
    const messageList = [...this.props.messages];
    const messageKey = messageList.findIndex((m) => m.id === message.id);

    if (messageKey > -1) {
      const messageObj = messageList[messageKey];
      const newMessageObj = { ...messageObj, ...message };

      messageList.splice(messageKey, 1, newMessageObj);
      this.props.actionGenerated(actions.MESSAGE_UPDATED, messageList);
    }
  };

  /**
   * Handler if the message is read and delivered.
   * @param message: message object
   */

  messageReadAndDelivered = (message) => {
    // read receipts
    if (
      message.getReceiverType() === CometChat.RECEIVER_TYPE.USER &&
      message.getSender().getUid() === this.props.item.uid &&
      message.getReceiver() === this.loggedInUser.uid
    ) {
      const messageList = [...this.props.messages];

      if (message.getReceiptType() === 'delivery') {
        // search for message
        const messageKey = messageList.findIndex(
          (m) => m.id === message.messageId,
        );

        if (messageKey > -1) {
          const messageObj = { ...messageList[messageKey] };
          const newMessageObj = {
            ...messageObj,
            deliveredAt: message.getDeliveredAt(),
          };
          messageList.splice(messageKey, 1, newMessageObj);

          this.props.actionGenerated(actions.MESSAGE_UPDATED, messageList);
        }
      } else if (message.getReceiptType() === 'read') {
        // search for message
        const messageKey = messageList.findIndex(
          (m) => m.id === message.messageId,
        );

        if (messageKey > -1) {
          const messageObj = { ...messageList[messageKey] };
          const newMessageObj = { ...messageObj, readAt: message.getReadAt() };
          messageList.splice(messageKey, 1, newMessageObj);

          this.props.actionGenerated(actions.MESSAGE_UPDATED, messageList);
        }
      }
    } else if (
      message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP &&
      message.getReceiver().guid === this.props.item.guid
    ) {
      // not implemented
    }
  };

  /**
   * handler if the message is received
   * @param message: message object
   */
  messageReceived = (message) => {
    try {
      // new messages
      this.markMessageAsDelivered(message);
      if (
        this.props.type === CometChat.RECEIVER_TYPE.GROUP &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP &&
        message.getReceiverId() === this.props.item.guid
      ) {
        if (!message.getReadAt()) {
          CometChat.markAsRead(message);
        }

        this.props.actionGenerated(actions.MESSAGE_RECEIVED, [message]);
      } else if (
        this.props.type === CometChat.RECEIVER_TYPE.USER &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.USER &&
        message.getSender().uid === this.props.item.uid
      ) {
        if (!message.getReadAt()) {
          CometChat.markAsRead(message);
        }

        this.props.actionGenerated(actions.MESSAGE_RECEIVED, [message]);
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handler for when a custom message is received.
   * @param message: message object
   */
  customMessageReceived = (message) => {
    try {
      // new messages
      if (
        this.props.type === CometChat.RECEIVER_TYPE.GROUP &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP &&
        message.getReceiverId() === this.props.item.guid
      ) {
        if (!message.getReadAt()) {
          CometChat.markAsRead(message);
        }

        if (Object.prototype.hasOwnProperty.call(message, 'metadata')) {
          this.props.actionGenerated(actions.CUSTOM_MESSAGE_RECEIVED, [
            message,
          ]);
        } else if (message.type === enums.CUSTOM_TYPE_STICKER) {
          this.props.actionGenerated(actions.CUSTOM_MESSAGE_RECEIVED, [
            message,
          ]);
        } else if (message.type === enums.CUSTOM_TYPE_POLL) {
          // custom data (poll extension) does not have metadata

          const newMessage = this.addMetadataToCustomData(message);
          this.props.actionGenerated(actions.CUSTOM_MESSAGE_RECEIVED, [
            newMessage,
          ]);
        } else if (message.type === enums.CUSTOM_TYPE_MEETING) {
          // custom data (poll extension) does not have metadata
          this.props.actionGenerated(actions.CUSTOM_MESSAGE_RECEIVED, [
            message,
          ]);
        }
      } else if (
        this.props.type === CometChat.RECEIVER_TYPE.USER &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.USER &&
        message.getSender().uid === this.props.item.uid
      ) {
        if (!message.getReadAt()) {
          CometChat.markAsRead(message);
        }

        if (Object.prototype.hasOwnProperty.call(message, 'metadata')) {
          this.props.actionGenerated(actions.CUSTOM_MESSAGE_RECEIVED, [
            message,
          ]);
        } else if (message.type === enums.CUSTOM_TYPE_STICKER) {
          this.props.actionGenerated(actions.CUSTOM_MESSAGE_RECEIVED, [
            message,
          ]);
        } else if (message.type === enums.CUSTOM_TYPE_POLL) {
          // custom data (poll extension) does not have metadata
          const newMessage = this.addMetadataToCustomData(message);
          this.props.actionGenerated(actions.CUSTOM_MESSAGE_RECEIVED, [
            newMessage,
          ]);
        }
      } else if (
        this.props.type === CometChat.RECEIVER_TYPE.USER &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.USER &&
        message.getSender().uid === this.loggedInUser.uid
      ) {
        if (message.type === enums.CUSTOM_TYPE_POLL) {
          // custom data (poll extension) does not have metadata
          this.props.actionGenerated(actions.CUSTOM_MESSAGE_RECEIVED, [
            message,
          ]);
        }
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handler for adding meta data to custom data i.e polls.
   * @param message: message object
   */
  addMetadataToCustomData = (message) => {
    const { customData } = message.data;
    const { options } = customData;

    const resultOptions = {};
    options.map((option) => {
      resultOptions[option] = {
        text: options[option],
        count: 0,
      };
    });

    const polls = {
      id: message.id,
      options,
      results: {
        total: 0,
        options: resultOptions,
        question: customData.question,
      },
      question: customData.question,
    };

    return {
      ...message,
      metadata: { '@injected': { extensions: { polls } } },
    };
  };

  /**
   * call updated
   * @param message: message object
   */
  callUpdated = (message) => {
    try {
      if (
        this.props.type === CometChat.RECEIVER_TYPE.GROUP &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP &&
        message.getReceiverId() === this.props.item.guid
      ) {
        if (!message.getReadAt()) {
          CometChat.markAsRead(message);
        }

        this.props.actionGenerated(actions.CALL_UPDATED, message);
      } else if (
        this.props.type === CometChat.RECEIVER_TYPE.USER &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.USER &&
        message.getSender().uid === this.props.item.uid
      ) {
        if (!message.getReadAt()) {
          CometChat.markAsRead(message);
        }

        this.props.actionGenerated(actions.CALL_UPDATED, message);
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handler when the group is updated and reciever type is group
   * @param key: action name
   * @param message: message object
   * @param grup: group object
   * @param options: options
   */

  groupUpdated = (key, message, group, options) => {
    try {
      if (
        this.props.type === CometChat.RECEIVER_TYPE.GROUP &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP &&
        message.getReceiver().guid === this.props.item.guid
      ) {
        if (!message.getReadAt()) {
          CometChat.markAsRead(message);
        }

        this.props.actionGenerated(
          actions.GROUP_UPDATED,
          message,
          key,
          group,
          options,
        );
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * On message click handler
   * @param message: object message
   */
  handleClick = (message) => {
    this.props.onItemClick(message, 'message');
  };

  /**
   * handler for fetching sender message component of different types
   * @param message:message object
   * @param key
   */
  getSenderMessageComponent = (message, key) => {
    let component;

    if (Object.prototype.hasOwnProperty.call(message, 'deletedAt')) {
      component = (
        <CometChatDeleteMessageBubble
          theme={this.props.theme}
          key={key}
          item={this.props.item}
          type={this.props.type}
          message={message}
          messageOf={enums.MESSAGE_OF_SENDER}
        />
      );
    } else {
      switch (message.type) {
        case CometChat.MESSAGE_TYPE.TEXT:
          component = message.text ? (
            <CometChatSenderTextMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
              showMessage={this.props?.showMessage}
            />
          ) : null;
          break;
        case CometChat.MESSAGE_TYPE.IMAGE:
          component = message.data?.url ? (
            <CometChatSenderImageMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
              showMessage={this.props?.showMessage}
            />
          ) : null;
          break;
        case CometChat.MESSAGE_TYPE.FILE:
          component = message.data.attachments ? (
            <CometChatSenderFileMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
              showMessage={this.props?.showMessage}
            />
          ) : null;
          break;
        case CometChat.MESSAGE_TYPE.VIDEO:
          component = message.data.url ? (
            <CometChatSenderVideoMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
              showMessage={this.props?.showMessage}
            />
          ) : null;
          break;
        case CometChat.MESSAGE_TYPE.AUDIO:
          component = message.data.url ? (
            <CometChatSenderAudioMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
              showMessage={this.props?.showMessage}
            />
          ) : null;
          break;
        default:
          break;
      }
    }

    return component;
  };

  /**
   * handler for fetching receiver message component of different types
   * @param message: message object
   * @param key: key object
   */

  getReceiverMessageComponent = (message, key) => {
    let component;

    if (Object.prototype.hasOwnProperty.call(message, 'deletedAt')) {
      component = (
        <CometChatDeleteMessageBubble
          theme={this.props.theme}
          key={key}
          message={message}
          messageOf={enums.MESSAGE_OF_RECEIVER}
        />
      );
    } else {
      switch (message.type) {
        case 'message':
        case CometChat.MESSAGE_TYPE.TEXT:
          component = message.text ? (
            <CometChatReceiverTextMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
              showMessage={this.props?.showMessage}
            />
          ) : null;
          break;
        case CometChat.MESSAGE_TYPE.IMAGE:
          component = message.data.url ? (
            <CometChatReceiverImageMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
              showMessage={this.props?.showMessage}
            />
          ) : null;
          break;
        case CometChat.MESSAGE_TYPE.FILE:
          component = message.data.attachments ? (
            <CometChatReceiverFileMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
              showMessage={this.props?.showMessage}
            />
          ) : null;
          break;
        case CometChat.MESSAGE_TYPE.AUDIO:
          component = message.data.url ? (
            <CometChatReceiverAudioMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
              showMessage={this.props?.showMessage}
            />
          ) : null;
          break;
        case CometChat.MESSAGE_TYPE.VIDEO:
          component = message.data.url ? (
            <CometChatReceiverVideoMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              widgetconfig={this.props.widgetconfig}
              actionGenerated={this.props.actionGenerated}
              showMessage={this.props?.showMessage}
            />
          ) : null;
          break;
        default:
          break;
      }
    }
    return component;
  };

  /**
   * handler for fetching custom message component from sender.
   * @param message: message object
   * @param key: key object
   */

  getSenderCustomMessageComponent = (message, key) => {
    let component;
    if (Object.prototype.hasOwnProperty.call(message, 'deletedAt')) {
      component = (
        <CometChatDeleteMessageBubble
          theme={this.props.theme}
          key={key}
          item={this.props.item}
          type={this.props.type}
          message={message}
          messageOf={enums.MESSAGE_OF_SENDER}
        />
      );
    } else {
      switch (message.type) {
        case enums.CUSTOM_TYPE_POLL:
          component = (
            <CometChatSenderPollMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              actionGenerated={this.props.actionGenerated}
              showMessage={this.props?.showMessage}
            />
          );
          break;
        case enums.CUSTOM_TYPE_STICKER:
          component = (
            <CometChatSenderStickerMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              actionGenerated={this.props.actionGenerated}
              showMessage={this.props?.showMessage}
            />
          );
          break;
        case 'meeting':
          component = (
            <CometChatSenderDirectCallBubble
              loggedInUser={this.loggedInUser}
              key={key}
              message={message}
              {...this.props}
              actionGenerated={this.props.actionGenerated}
            />
          );
          break;
        default:
          break;
      }
    }
    return component;
  };

  /**
   * handler for fetching custom message component from receiver
   * @param
   */
  getReceiverCustomMessageComponent = (message, key) => {
    let component;
    if (Object.prototype.hasOwnProperty.call(message, 'deletedAt')) {
      component = (
        <CometChatDeleteMessageBubble
          theme={this.props.theme}
          key={key}
          item={this.props.item}
          type={this.props.type}
          message={message}
          messageOf={enums.MESSAGE_OF_RECEIVER}
        />
      );
    } else {
      switch (message.type) {
        case enums.CUSTOM_TYPE_POLL:
          component = (
            <CometChatReceiverPollMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              actionGenerated={this.props.actionGenerated}
              showMessage={this.props?.showMessage}
            />
          );
          break;
        case enums.CUSTOM_TYPE_STICKER:
          component = (
            <CometChatReceiverStickerMessageBubble
              loggedInUser={this.loggedInUser}
              theme={this.props.theme}
              key={key}
              item={this.props.item}
              type={this.props.type}
              message={message}
              actionGenerated={this.props.actionGenerated}
            />
          );
          break;
        case 'meeting':
          component = (
            <CometChatReceiverDirectCallBubble
              loggedInUser={this.loggedInUser}
              key={key}
              message={message}
              actionGenerated={this.props.actionGenerated}
              {...this.props}
            />
          );
          break;
        default:
          break;
      }
    }

    return component;
  };

  /**
   * handler for fetching call message component (action message bubble)
   * @param message:message object
   * @param key
   */

  getCallMessageComponent = (message, key) => {
    return (
      <CometChatActionMessageBubble
        message={message}
        key={key}
        theme={this.props.theme}
        loggedInUser={this.loggedInUser}
      />
    );
  };

  /**
   * get action message component
   * @param
   */
  getActionMessageComponent = (message, key) => {
    console.log('444',message.message);
    message.message = message.message.replace('joined', 'katıldı');
    message.message = message.message.replace('left', 'ayrıldı');
    message.message = message.message.replace('added', 'yeni üye ekledi  @');

    let component = null;
    if (message.message) {
      component = (
        <View style={styles.actionMessageStyle} key={key}>
          <Text style={styles.actionMessageTxtStyle}>{message.message}</Text>
        </View>
      );

      // if action messages are set to hide in config
      if (this.props.messageConfig) {
        const found = this.props.messageConfig.find((cfg) => {
          return (
            cfg.action === message.action && cfg.category === message.category
          );
        });

        if (found && found.enabled === false) {
          component = null;
        }
      }
    }

    return component;
  };

  /**
   * get component for all fetching all components(parent function)
   * @param message: object message
   * @param key
   */
  getComponent = (message, key) => {
    let component;

    switch (message.category) {
      case 'action':
        component = this.getActionMessageComponent(message, key);
        break;
      case 'call':
        component = this.getCallMessageComponent(message, key);
        break;
      case 'message':
        if (
          this.loggedInUser.uid === message?.sender?.uid ||
          this.loggedInUser.uid === message?.data?.sender?.uid
        ) {
          console.log('1077',message);
          component = this.getSenderMessageComponent(message, key);
        } else {
          console.log('1078',message);

          component = this.getReceiverMessageComponent(message, key);
        }
        break;
      case 'custom':
        if (this.loggedInUser.uid === message.sender.uid) {
          component = this.getSenderCustomMessageComponent(message, key);
        } else {
          component = this.getReceiverCustomMessageComponent(message, key);
        }

        break;
      default:
        break;
    }

    return component;
  };

  listEmptyComponent = () => {
    return (
      <View style={[styles.chatListStyle]}>
        <View style={styles.decoratorMessageStyle}>
          <Text
            style={[
              styles.decoratorMessageTxtStyle,
              {
                color: `${this.props.theme.color.secondary}`,
              },
            ]}>
            {this.decoratorMessage}
          </Text>
        </View>
      </View>
    );
  };

  renderItem = ({ item, index }) => {
    let messages = [...this.props.messages];
    let currentDate=new Date().toLocaleDateString('tr-TR');
    if (messages.length) {
      messages = messages.reverse();
      if (!cDate) {
        cDate = new Date(messages[0].sentAt * 1000).toLocaleDateString('tr-TR');
      }
    }

    const message = item;
    // console.log('1100',message);
    let dateSeparator = null;
    const nextMessage = messages[index + 1];
    const messageSentDate = nextMessage
      ? new Date(nextMessage.sentAt * 1000).toLocaleDateString('tr-TR')
      : null;
    if (cDate !== messageSentDate && messages[0].sentAt) {
      let dateValue = null;
        if(cDate == currentDate){
          dateValue = 'Bugün';
        } 
        else if(new Date() - new Date(messages[0].sentAt * 1000)==1){
          dateValue = 'Dün';
        } 
        else {
          dateValue = cDate;
        }
        dateSeparator = (
          <View style={[styles.messageDateContainerStyle]}>
            <Text
              style={[
                styles.messageDateStyle,
                {
                  color: `${this.props.theme.color.primary}`,
                },
              ]}>
              {dateValue}
            </Text>
          </View>
        );
    }
    cDate =
      messageSentDate ||
      new Date(messages[0].sentAt * 1000).toLocaleDateString('tr-TR');
    return (
      <View>
        {index ? dateSeparator : null}
        {this.getComponent(message)}
      </View>
    );
  };

  newMsgComponent = () => {
    if (this.yOffset > 50) {
      this.setState({ showNewMsg: true });
    }
  };
  //////
 pinGet=()=>{
  console.log('1153',  this.props.type,      this.props.item  );
  var uid=this.props.type=="group"?this.props.item.guid:this.props.uid
  const URL = `v1/fetch?receiverType=${this.props.type}&receiver=${uid}`;
CometChat.callExtension('pin-message', 'GET', URL, null).then(response => {
    // {pinnedMessages: []}
    console.log('1155',response.pinnedMessages[0]);
    this.setState({pinmessage:response.pinnedMessages})
})
.catch(error => {
  console.log('1188',error);
    // Error occured
});
 }

//  pinGet1= ()=>{
//   console.log('1153',  this.props.type,      this.props.item  );
//   var uid=this.props.type=="group"?this.props.item.guid:this.props.uid
//   const URL = `v1/fetch?receiverType=${this.props.type}&receiver=${uid}`;
// CometChat.callExtension('pin-message', 'GET', URL, null).then(response => {
//     // {pinnedMessages: []}
//     console.log('1155',response.pinnedMessages);
//     this.setState( response.pinnedMessages)
// })
// .catch(error => {
//   console.log('1188',error);
//   return []
//     // Error occured
// });
//  }
 PinnedMessagesF = (pinnedMessages) => {
console.log('3456',this.props.item);
  pinGet= ()=>{
    console.log('1153',  this.props.type,      this.props.item  );
    var uid=this.props.type=="group"?this.props.item.guid:this.props.uid
    const URL = `v1/fetch?receiverType=${this.props.type}&receiver=${uid}`;
  CometChat.callExtension('pin-message', 'GET', URL, null).then(response => {
      // {pinnedMessages: []}
      console.log('1155',response.pinnedMessages[0]);
      this.setState({pinmessage:response.pinnedMessages})
  })
  .catch(error => {
    console.log('1188',error);
      // Error occured
  });
   }
  
  //   const [pinnedMessages, setPinnedMessages] = useState([]);
  console.log('8888',pinnedMessages);
  
     unpinMessage =async (item) => {
      console.log('1179',item);
      console.log('1179',item.id);
      console.log('1179',item.receiverType);
      console.log('1179',item.receiver);
      const URL = 'v1/unpin';
      // var uid = props.type == "group" ? props.item.guid : props.uid;
      CometChat.callExtension('pin-message', 'DELETE', URL, {
        "msgId": item.id,
        "receiverType": item.receiverType,
        "receiver": item.receiver
      })
      .then(response => {
        pinGet();
      })
      .catch(error => {
        console.log('Error unpinning message:', error);
      });
    };
  
     renderItem1 = ({ item }) => {
    var yazan=  this.loggedInUser.uid === item?.sender?.uid ||this.loggedInUser.uid === item?.sender ||
    this.loggedInUser.uid === item?.data?.sender?.uid?"Sen":item.sender

     let  date = new Date(item.sentAt * 1000)
     let formattedDate = date.toLocaleDateString("tr-TR");
     let formattedTime = date.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' });
     return (

          <View style={{flexDirection:"row"}}>
                  <View style={{flexDirection:"column",justifyContent:"center"}}>

              <Icon name='pin' size={30} color='green' />    
             {/* <Image source={assets.} style={styles.icon} /> */}
                  </View>
       
                <View style={[styles1.messageBubble1,{flex:1,flexDirection:"row",width:'100%'}]}>
               
                  <View style={{flex:14,flexDirection:"column"}}>
                          <View style={{flexDirection: 'row'}}>
                      
                          <Text>{item.data.text}</Text>
                          </View>
                  
                        <View style={{ flexDirection: 'row'}}>
                        <Text style={[styles1.senderInfo,{color:constants.primarycolor}]}>
                          {/* {item.sender}  */}
                          {yazan}
                        </Text>
                        <Text style={[styles1.senderInfo,{paddingLeft:11}]}>
                          {formattedDate} {formattedTime}
                        </Text>
                        </View>
                </View>

                  <View style={{flex:1, justifyContent:"center",alignContent:"flex-end" }}>

               
                  <TouchableOpacity 
                  style={styles1.ss}
                  onPress={() => unpinMessage(item)}>
                  <Icon name='close' size={24} color="lightgrey" />    
                  {/* <Text style={{fontSize:22,    backgroundColor:constants.lightGrey}}>x</Text> */}
                  </TouchableOpacity>
                  </View>
                  </View>

                {/* </View> */}
              
                <View>

              

                </View>
        </View>
    )
  };
    
  if(this.state.pinadd!==this.props.pinadd){
    pinGet()
  }{
    this.setState({pinadd:this.props.pinadd})
  }
  console.log('22224',this.state.pinmessage);
    return (
      <SafeAreaView>
        <FlatList
          data={this.state.pinmessage}
          renderItem={renderItem1}
          keyExtractor={(item) => item.id.toString()}
        />
      </SafeAreaView>
    );
  };

///////
  render() {

    let messages = [...this.props.messages];
    if (messages.length) {
      messages = messages.reverse();
      // console.log('1155',messages);
    }

    let newMsgPopUp = (
      <View style={styles.newMessagePopupContainer}>
        <TouchableOpacity
          onPress={() => {
            this.setState({ showNewMsg: null }, () => {
              this.flatListRef.current.scrollToOffset({
                offset: 0,
                animated: true,
              });
            });
          }}
          style={styles.newMessageTextContainer}>
          <Text>Yeni mesaj</Text>
          <Icon
            name="arrow-down"
            style={{ marginLeft: 5 }}
            size={15}
            color="#000"
          />
        </TouchableOpacity>
      </View>
    );
      console.log('1233',this.props.pinadd,this.state.pinadd);
    return (
      <>
                { (this.state.pinmessage||
                this.state.pinadd!==this.props.pinadd)
                && 
                <View style={{
                  backgroundColor:"white",
                  justifyContent:"flex-end",
                  padding:11,
                  }}>{this.PinnedMessagesF (this.state.pinmessage)}
                 </View>}


        <FlatList
          ref={this.flatListRef}
          ListEmptyComponent={this.listEmptyComponent}
          onScroll={(event) => {
            this.yOffset = event.nativeEvent.contentOffset.y;
            if (this.yOffset > 50 && this.state.showNewMsg) {
              this.setState({ showNewMsg: false });
            }
          }}
          scrollEventThrottle={16}
          onEndReached={() => this.getMessages(true)}
          onEndReachedThreshold={0.3}
          inverted={-1}
          style={{ flex: 1, paddingHorizontal: 5,backgroundColor:"white" }}
          contentContainerStyle={!messages.length ? { flex: 1 } : {}}
          ListFooterComponent={
            messages.length && this.props.parentMessageComponent
              ? this.props.parentMessageComponent
              : null
          }
          data={messages}
          keyExtractor={(item, index) => item.messageId + '_' + index}
          renderItem={this.renderItem}
        />
{/* ÇALIŞMA ALANI */}


        {this.state.showNewMsg ? newMsgPopUp : null}
      </>
    );
  }
}
const styles1 = StyleSheet.create({
 ss:{
  
  flexDirection:"column", 
 justifyContent:"center",alignContent:"center" },
  messageBubble: {
      flex:1,
    flexDirection: 'row',
    padding: 10,
  //   paddingRight:30,
    backgroundColor: constants.lightGrey,
    borderRadius: 10,
    marginVertical: 5,
  //   alignItems: 'center',
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  messageBubble1: {
      flex:1,
    flexDirection: 'row',
    padding: 10,
  //   paddingRight:30,
    backgroundColor: constants.lightGrey,
     borderRadius: 6,
    marginVertical: 5,
  //   alignItems: 'center',
    alignSelf: 'flex-end',
  //   maxWidth: '80%',
  },
  icon: {
    width: 12,
    height: 16,
    tintColor: 'orange',
    marginRight: 10,
  },
  senderInfo: {
    //paddingRight:30,
    color: 'gray',
    alignSelf: 'flex-end',
    maxWidth: '80%',

  },
});
export default CometChatMessageList;
