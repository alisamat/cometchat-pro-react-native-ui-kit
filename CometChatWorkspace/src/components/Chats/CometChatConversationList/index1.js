/* eslint-disable no-param-reassign */
/* eslint-disable react/no-did-update-set-state */
/* eslint-disable radix */
import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
// import { NavigationContainer } from '@react-navigation/native';
import { showMessage, hideMessage } from "react-native-flash-message";

import assets from '../../../../../../assets';
import constants from '../../../../../../Util/Constants';
import { CometChatManager } from '../../../utils/controller';
import { ConversationListManager } from './controller';
import * as enums from '../../../utils/enums';
import * as consts from '../../../utils/consts';
import CometChatConversationListItem from '../CometChatConversationListItem/index1';
import theme from '../../../resources/theme';
import styles from './styles';
import Sound from 'react-native-sound';
import DropDownAlert from '../../Shared/DropDownAlert';
import { UIKitSettings } from '../../../utils/UIKitSettings';
import {
  CometChatContextProvider,
  CometChatContext,
} from '../../../utils/CometChatContext';
import { incomingOtherMessageAlert } from '../../../resources/audio';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ToastAndroid,
  Vibration
} from 'react-native';
import { logger } from '../../../utils/common';
import { SwipeListView } from 'react-native-swipe-list-view';
import style from '../../Groups/CometChatViewGroupMemberListItem/style';
const {width, height, widthRatio, heightRatio} = constants.styleGuide;


class CometChatConversationList extends React.Component {
  loggedInUser = null;

  decoratorMessage = 'Yükleniyor...';
  static contextType = CometChatContext;
  constructor(props) {
    super(props);

    this.state = {
      selectitem:{},
      conversationList: [],
      selectedConversation: undefined,
      showSmallHeader: false,
      isMessagesSoundEnabled: true,
      filteredConversationList: [], // Filtered conversation list based on search query
      searchQuery: "", // To k
    };
    this.chatListRef = React.createRef();
    this.theme = { ...theme, ...this.props.theme };
    Sound.setCategory('Ambient', true);
    this.audio = new Sound(incomingOtherMessageAlert);
    this.UIKitSettingsBuilder = new UIKitSettings();
  }

  componentDidMount() {
    this.decoratorMessage = 'Yükleniyor...';
    
    if (this.ConversationListManager) {
      this.ConversationListManager.removeListeners();
    }
    this.setState({ conversationList: [] });
    this.ConversationListManager = new ConversationListManager();
    this.getConversations();
    this.ConversationListManager.attachListeners(this.conversationUpdated);
    this.checkRestrictions();
    try {
      this.navListener = this.props.navigation.addListener('focus', () => {
        this.decoratorMessage = 'Yükleniyor...';
        if (this.ConversationListManager) {
          this.ConversationListManager.removeListeners();
        }
        this.setState({ conversationList: [] });
        this.ConversationListManager = new ConversationListManager();
        this.getConversations();
        this.ConversationListManager.attachListeners(this.conversationUpdated);
        this.checkRestrictions();
      });
    } catch (error) {
      logger(error);
    }
  }

  checkRestrictions = async () => {
    let isMessagesSoundEnabled =
      await this.context.FeatureRestriction.isMessagesSoundEnabled();
    this.setState({ isMessagesSoundEnabled });
  };

  componentDidUpdate(prevProps) {
    try {
      const previousItem = JSON.stringify(prevProps.item);
      const currentItem = JSON.stringify(this.props.item);

      // if different conversation is selected
      if (previousItem !== currentItem) {
        if (Object.keys(this.props.item).length === 0) {
          this.chatListRef.scrollTop = 0;
          this.setState({ selectedConversation: {} });
        } else {
          const conversationList = [...this.state.conversationList];
          const conversationObj = conversationList.find((c) => {
            if (
              (c.conversationType === this.props.type &&
                this.props.type === 'user' &&
                c.conversationWith.uid === this.props.item.uid) ||
              (c.conversationType === this.props.type &&
                this.props.type === CometChat.ACTION_TYPE.TYPE_GROUP &&
                c.conversationWith.guid === this.props.item.guid)
            ) {
              return c;
            }

            return false;
          });

          if (conversationObj) {
            const conversationKey = conversationList.indexOf(conversationObj);
            const newConversationObj = {
              ...conversationObj,
              unreadMessageCount: 0,
            };

            conversationList.splice(conversationKey, 1, newConversationObj);
            this.setState({
              conversationList,
              selectedConversation: newConversationObj,
            });
          }
        }
      }

      // if user is blocked/unblocked, update conversationList in state
      if (
        prevProps.item &&
        Object.keys(prevProps.item).length &&
        prevProps.item.uid === this.props.item.uid &&
        prevProps.item.blockedByMe !== this.props.item.blockedByMe
      ) {
        const conversationList = [...this.state.conversationList];

        // search for user
        const convKey = conversationList.findIndex(
          (c) =>
            c.conversationType === 'user' &&
            c.conversationWith.uid === this.props.item.uid,
        );
        if (convKey > -1) {
          conversationList.splice(convKey, 1);

          this.setState({ conversationList });
        }
      }

      if (
        prevProps.groupToUpdate &&
        (prevProps.groupToUpdate.guid !== this.props.groupToUpdate.guid ||
          (prevProps.groupToUpdate.guid === this.props.groupToUpdate.guid &&
            (prevProps.groupToUpdate.membersCount !==
              this.props.groupToUpdate.membersCount ||
              prevProps.groupToUpdate.scope !==
                this.props.groupToUpdate.scope)))
      ) {
        const conversationList = [...this.state.conversationList];
        const { groupToUpdate } = this.props;

        const convKey = conversationList.findIndex(
          (c) =>
            c.conversationType === 'group' &&
            c.conversationWith.guid === groupToUpdate.guid,
        );
        if (convKey > -1) {
          const convObj = conversationList[convKey];

          const convWithObj = { ...convObj.conversationWith };

          const newConvWithObj = {
            ...convWithObj,
            scope: groupToUpdate.scope,
            membersCount: groupToUpdate.membersCount,
          };
          const newConvObj = { ...convObj, conversationWith: newConvWithObj };

          conversationList.splice(convKey, 1, newConvObj);
          this.setState({ conversationList });
        }
      }

      if (prevProps.messageToMarkRead !== this.props.messageToMarkRead) {
        const message = this.props.messageToMarkRead;
        this.makeConversation(message)
          .then((response) => {
            const { conversationKey, conversationObj, conversationList } =
              response;

            if (conversationKey > -1) {
              const unreadMessageCount = this.makeUnreadMessageCount(
                conversationObj,
                'decrement',
              );
              const lastMessageObj = this.makeLastMessage(
                message,
                conversationObj,
              );

              const newConversationObj = {
                ...conversationObj,
                lastMessage: lastMessageObj,
                unreadMessageCount,
              };
              conversationList.splice(conversationKey, 1);
              conversationList.unshift(newConversationObj);
              this.setState({ conversationList: conversationList });
            }
          })
          .catch((error) => {
            const errorCode = error?.message || 'ERROR';
            this.dropDownAlertRef?.showMessage('error', errorCode);
            logger(
              'This is an error in converting message to conversation',
              error,
            );
          });
      }

      if (prevProps.lastMessage !== this.props.lastMessage) {
        const { lastMessage } = this.props;
        const conversationList = [...this.state.conversationList];
        const conversationKey = conversationList.findIndex(
          (c) => c.conversationId === lastMessage.conversationId,
        );

        if (conversationKey > -1) {
          const conversationObj = conversationList[conversationKey];
          const newConversationObj = { ...conversationObj, lastMessage };

          conversationList.splice(conversationKey, 1);
          conversationList.unshift(newConversationObj);
          this.setState({ conversationList: conversationList });
        } else {
          // TODO: dont know what to do here
          const chatListMode = this.UIKitSettingsBuilder.chatListMode;
          const chatListFilterOptions = UIKitSettings.chatListFilterOptions;
          if (chatListMode !== chatListFilterOptions['USERS_AND_GROUPS']) {
            if (
              (chatListMode === chatListFilterOptions['USERS'] &&
                lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP) ||
              (chatListMode === chatListFilterOptions['GROUPS'] &&
                lastMessage.receiverType === CometChat.RECEIVER_TYPE.USER)
            ) {
              return false;
            }
          }

          const getConversationId = () => {
            let conversationId = null;
            if (this.getContext().type === CometChat.RECEIVER_TYPE.USER) {
              const users = [this.loggedInUser.uid, this.getContext().item.uid];
              conversationId = users.sort().join('_user_');
            } else if (
              this.getContext().type === CometChat.RECEIVER_TYPE.GROUP
            ) {
              conversationId = `group_${this.getContext().item.guid}`;
            }

            return conversationId;
          };

          let newConversation = new CometChat.Conversation();
          newConversation.setConversationId(getConversationId());
          newConversation.setConversationType(this.getContext().type);
          newConversation.setConversationWith(this.getContext().item);
          newConversation.setLastMessage(lastMessage);
          newConversation.setUnreadMessageCount(0);

          conversationList.unshift(newConversation);
          this.setState({ conversationList: conversationList });
          // this.getContext().setLastMessage({});
        }
      }

      if (
        prevProps.groupToDelete &&
        prevProps.groupToDelete.guid !== this.props.groupToDelete.guid
      ) {
        let conversationList = [...this.state.conversationList];
        const groupKey = conversationList.findIndex(
          (member) =>
            member.conversationWith.guid === this.props.groupToDelete.guid,
        );
        if (groupKey > -1) {
          conversationList.splice(groupKey, 1);
          this.setState({ conversationList: conversationList });
          if (conversationList.length === 0) {
            this.decoratorMessage = 'Sohbet bulunamadı';
          }
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  componentWillUnmount() {
    try {
      if (this.ConversationListManager) {
        this.ConversationListManager.removeListeners();
      }
      this.ConversationListManager = null;
      if (this.navListener) this.navListener();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Handles live updates from server using listeners
   * @param key:action
   * @param item:object related to Users
   * @param message:object related to Messages
   * @param options: extra data
   * @param actionBy: user object of action taker
   */
  conversationUpdated = (key, item, message, options, actionBy) => {
    const chatListMode = this.UIKitSettingsBuilder.chatListMode;
    const chatListFilterOptions = UIKitSettings.chatListFilterOptions;

    if (chatListMode !== chatListFilterOptions['USERS_AND_GROUPS']) {
      if (
        (chatListMode === chatListFilterOptions['USERS'] &&
          message.receiverType === CometChat.RECEIVER_TYPE.GROUP) ||
        (chatListMode === chatListFilterOptions['GROUPS'] &&
          message.receiverType === CometChat.RECEIVER_TYPE.USER)
      ) {
        return false;
      }
    }
    try {
      switch (key) {
        case enums.USER_ONLINE:
        case enums.USER_OFFLINE:
          this.updateUser(item);
          break;
        case enums.TEXT_MESSAGE_RECEIVED:
        case enums.MEDIA_MESSAGE_RECEIVED:
        case enums.CUSTOM_MESSAGE_RECEIVED:
          this.updateConversation(message);
          this.markMessageAsDelivered(message);
          break;
        case enums.MESSAGE_EDITED:
        case enums.MESSAGE_DELETED:
          this.conversationEditedDeleted(message);
          break;
        case enums.INCOMING_CALL_RECEIVED:
        case enums.INCOMING_CALL_CANCELLED:
          this.updateConversation(message, false);
          break;
        case enums.GROUP_MEMBER_ADDED:
          if (this.loggedInUser.uid !== actionBy.uid)
            this.updateGroupMemberAdded(message, options);
          break;
        case enums.GROUP_MEMBER_KICKED:
        case enums.GROUP_MEMBER_BANNED:
        case enums.GROUP_MEMBER_LEFT:
          this.updateGroupMemberRemoved(message, options);
          break;
        case enums.GROUP_MEMBER_SCOPE_CHANGED:
          this.updateGroupMemberScopeChanged(message, options);
          break;
        case enums.GROUP_MEMBER_JOINED:
          this.updateGroupMemberChanged(message, options, 'increment');
          break;
        case enums.GROUP_MEMBER_UNBANNED:
          this.updateGroupMemberChanged(message, options, '');
          break;
        default:
          break;
      }
    } catch (error) {
      logger(error);
    }
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
        '[CometChatConversationList markMessageAsDelivered] faailed to mark as deivered =',
        message,
      );
    }
  };

  /**
   * Handle update user details in existing conversation object
   * @param user:User Object
   */
  updateUser = (user) => {
    try {
      const conversationList = [...this.state.conversationList];
      const conversationKey = conversationList.findIndex(
        (conversationObj) =>
          conversationObj.conversationType === 'user' &&
          conversationObj.conversationWith.uid === user.uid,
      );

      if (conversationKey > -1) {
        const conversationObj = { ...conversationList[conversationKey] };
        const conversationWithObj = {
          ...conversationObj.conversationWith,
          status: user.getStatus(),
        };

        const newConversationObj = {
          ...conversationObj,
          conversationWith: conversationWithObj,
        };
        conversationList.splice(conversationKey, 1, newConversationObj);
        this.setState({ conversationList });
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Play audio alert
   * @param
   */
  playAudio = () => {
    try {
      if (this.state.playingAudio || !this.state.isMessagesSoundEnabled) {
        return false;
      }

      this.setState({ playingAudio: true }, () => {
        this.audio.setCurrentTime(0);
        this.audio.play(() => {
          this.setState({ playingAudio: false });
        });
      });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Retrieve conversation object from message
   * @param message : message object
   */
  makeConversation = (message) => {
    const promise = new Promise((resolve, reject) => {
      CometChat.CometChatHelper.getConversationFromMessage(message)
        .then((conversation) => {
          const conversationList = [...this.state.conversationList];
          const conversationKey = conversationList.findIndex(
            (c) => c.conversationId === conversation.conversationId,
          );
          let conversationObj = { ...conversation };
          if (conversationKey > -1) {
            conversationObj = { ...conversationList[conversationKey] };
          }

          resolve({
            conversationKey,
            conversationObj,
            conversationList,
          });
        })
        .catch((error) => reject(error));
    });

    return promise;
  };

  /**
   * Retrieve unread message count from conversation
   * @param conversation : conversation object
   * @param operator : extra option to handle decrease in unread message count
   */
  makeUnreadMessageCount = (conversation = {}, operator) => {
    try {
      if (Object.keys(conversation).length === 0) {
        return 1;
      }

      let unreadMessageCount = parseInt(conversation.unreadMessageCount);
      if (operator && operator === 'decrement') {
        unreadMessageCount = unreadMessageCount ? unreadMessageCount - 1 : 0;
      } else {
        unreadMessageCount += 1;
      }

      return unreadMessageCount;
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Retrieve message data
   * @param
   */
  makeLastMessage = (message) => {
    const newMessage = { ...message };
    return newMessage;
  };

  /**
   * Handle updating conversation object on any message
   * @param message: message object
   * @param notification: boolean to play audio alert @default : true
   */
  updateConversation = (message, notification = true) => {
    this.makeConversation(message)
      .then((response) => {
        const { conversationKey, conversationObj, conversationList } = response;

        if (conversationKey > -1) {
          const unreadMessageCount = this.makeUnreadMessageCount(
            conversationList[conversationKey],
          );
          const lastMessageObj = this.makeLastMessage(message, conversationObj);

          const newConversationObj = {
            ...conversationObj,
            lastMessage: lastMessageObj,
            unreadMessageCount,
          };
          conversationList.splice(conversationKey, 1);
          conversationList.unshift(newConversationObj);
          this.setState({ conversationList: conversationList });

          if (notification) {
            this.playAudio(message);
          }
        } else {
          const unreadMessageCount = this.makeUnreadMessageCount();
          const lastMessageObj = this.makeLastMessage(message);

          const newConversationObj = {
            ...conversationObj,
            lastMessage: lastMessageObj,
            unreadMessageCount,
          };
          conversationList.unshift(newConversationObj);
          this.setState({ conversationList: conversationList });

          if (notification) {
            this.playAudio(message);
          }
        }
      })
      .catch((error) => {
        logger('This is an error in converting message to conversation', error);
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
      });
  };

  /**
   * Handle editing/deleting conversation object
   * @param message: message object
   */
  conversationEditedDeleted = (message) => {
    this.makeConversation(message)
      .then((response) => {
        const { conversationKey, conversationObj, conversationList } = response;

        if (conversationKey > -1) {
          const lastMessageObj = conversationObj.lastMessage;

          if (lastMessageObj.id === message.id) {
            const newLastMessageObj = { ...lastMessageObj, ...message };
            const newConversationObj = {
              ...conversationObj,
              lastMessage: newLastMessageObj,
            };
            conversationList.splice(conversationKey, 1, newConversationObj);
            this.setState({ conversationList: conversationList });
          }
        }
      })
      .catch((error) => {
        logger('This is an error in converting message to conversation', error);
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
      });
  };

  /**
   * Handle updating group member in existing conversation objects
   * @param message: message object
   * @param options: contains user object for user added to group
   */
  updateGroupMemberAdded = (message, options) => {
    this.makeConversation(message)
      .then((response) => {
        const { conversationKey, conversationObj, conversationList } = response;

        if (conversationKey > -1) {
          const unreadMessageCount =
            this.makeUnreadMessageCount(conversationObj);
          const lastMessageObj = this.makeLastMessage(message, conversationObj);

          const conversationWithObj = { ...conversationObj.conversationWith };
          const membersCount = parseInt(conversationWithObj.membersCount) + 1;
          const newConversationWithObj = {
            ...conversationWithObj,
            membersCount,
          };

          const newConversationObj = {
            ...conversationObj,
            conversationWith: newConversationWithObj,
            lastMessage: lastMessageObj,
            unreadMessageCount,
          };
          conversationList.splice(conversationKey, 1);
          conversationList.unshift(newConversationObj);
          this.setState({ conversationList: conversationList });
          this.playAudio(message);
        } else if (options && this.loggedInUser.uid === options.user.uid) {
          const unreadMessageCount = this.makeUnreadMessageCount();
          const lastMessageObj = this.makeLastMessage(message);

          const conversationWithObj = { ...conversationObj.conversationWith };
          const membersCount = parseInt(conversationWithObj.membersCount) + 1;
          const scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
          const { hasJoined } = options;

          const newConversationWithObj = {
            ...conversationWithObj,
            membersCount,
            scope,
            hasJoined,
          };
          const newConversationObj = {
            ...conversationObj,
            conversationWith: newConversationWithObj,
            lastMessage: lastMessageObj,
            unreadMessageCount,
          };
          conversationList.unshift(newConversationObj);
          this.setState({ conversationList: conversationList });
          this.playAudio(message);
        }
      })
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
        logger('This is an error in converting message to conversation', error);
      });
  };

  /**
   * Handle removing group member in existing conversation objects
   * @param message: message object
   * @param options: contains user object for user removed from group
   */
  updateGroupMemberRemoved = (message, options) => {
    this.makeConversation(message)
      .then((response) => {
        const { conversationKey, conversationObj, conversationList } = response;

        if (conversationKey > -1) {
          if (options && this.loggedInUser.uid === options.user.uid) {
            conversationList.splice(conversationKey, 1);
            this.setState({ conversationList: conversationList });
          } else {
            const unreadMessageCount =
              this.makeUnreadMessageCount(conversationObj);
            const lastMessageObj = this.makeLastMessage(
              message,
              conversationObj,
            );

            const conversationWithObj = { ...conversationObj.conversationWith };
            const membersCount = parseInt(conversationWithObj.membersCount) - 1;
            const newConversationWithObj = {
              ...conversationWithObj,
              membersCount,
            };

            const newConversationObj = {
              ...conversationObj,
              conversationWith: newConversationWithObj,
              lastMessage: lastMessageObj,
              unreadMessageCount,
            };
            conversationList.splice(conversationKey, 1);
            conversationList.unshift(newConversationObj);
            this.setState({ conversationList: conversationList });
            this.playAudio(message);
          }
        }
      })
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
        logger('This is an error in converting message to conversation', error);
      });
  };

  /**
   * Handle updating group member scope in existing conversation objects
   * @param message: message object
   * @param options: contains user object for user whose scope is changed to group
   */
  updateGroupMemberScopeChanged = (message, options) => {
    this.makeConversation(message)
      .then((response) => {
        const { conversationKey, conversationObj, conversationList } = response;

        if (conversationKey > -1) {
          const unreadMessageCount =
            this.makeUnreadMessageCount(conversationObj);
          const lastMessageObj = this.makeLastMessage(message, conversationObj);

          const conversationWithObj = { ...conversationObj.conversationWith };
          const membersCount = parseInt(conversationWithObj.membersCount);
          let { scope } = conversationWithObj;

          if (options && this.loggedInUser.uid === options.user.uid) {
            scope = options.scope;
          }

          const newConversationWithObj = {
            ...conversationWithObj,
            membersCount,
            scope,
          };
          const newConversationObj = {
            ...conversationObj,
            conversationWith: newConversationWithObj,
            lastMessage: lastMessageObj,
            unreadMessageCount,
          };
          conversationList.splice(conversationKey, 1);
          conversationList.unshift(newConversationObj);
          this.setState({ conversationList: conversationList });
          this.playAudio(message);
        }
      })
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
        logger('This is an error in converting message to conversation', error);
      });
  };

  /**
   * Handle updating group members in existing conversation objects on member joined/unbanned
   * @param message: message object
   * @param options: contains user object for user added to group
   * @param operator: for incrementing member count
   */
  updateGroupMemberChanged = (message, options, operator) => {
    this.makeConversation(message)
      .then((response) => {
        const { conversationKey, conversationObj, conversationList } = response;
        if (conversationKey > -1) {
          if (options && this.loggedInUser.uid !== options.user.uid) {
            const unreadMessageCount =
              this.makeUnreadMessageCount(conversationObj);
            const lastMessageObj = this.makeLastMessage(
              message,
              conversationObj,
            );

            const conversationWithObj = { ...conversationObj.conversationWith };
            let membersCount = parseInt(conversationWithObj.membersCount);
            if (operator === 'increment') {
              membersCount += 1;
            }

            const newConversationWithObj = {
              ...conversationWithObj,
              membersCount,
            };
            const newConversationObj = {
              ...conversationObj,
              conversationWith: newConversationWithObj,
              lastMessage: lastMessageObj,
              unreadMessageCount,
            };
            conversationList.splice(conversationKey, 1);
            conversationList.unshift(newConversationObj);
            this.setState({ conversationList: conversationList });
            this.playAudio(message);
          }
        }
      })
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
        logger('This is an error in converting message to conversation', error);
      });
  };
///
showmessageDisappearing =()=>{
  showMessage({
    message: "MESAJ", 
  description: "Mesaj gönderildi.", 
  type: "success",
  //  icon: "success", 
    // position: "right",
    // icon: props =>     <Icon name="md-time" size={45} color="white"/>,
    
   autoHide:true,
  statusBarHeight:40*heightRatio,
  onPress: () => {
    // this.setState({pushloading:false})
    hideMessage()
  },
  });
}
sendTextMessage = (item) => {

  try {
    let receiverId1=item.lastMessage.rawMessage.receiver
    let  messageInput1=this.props.selecttextmessage
    let  receiverType1=item.lastMessage.rawMessage.receiverType
    let conversationId1=item.conversationId
    console.log('1233',this.props.selectedtextmessage);
console.log('825',receiverId1,messageInput1,receiverType1,conversationId1);
    // if (this.state.emojiViewer) {
    //   this.setState({ emojiViewer: false });
    // }

    if (!messageInput1.trim().length) {
      return false;
    }

    // if (this.state.messageToBeEdited) {
    //   this.editMessage();
    //   return false;
    // }
    // this.endTyping();

    // const { receiverId, receiverType } = this.getReceiverDetails();
    const messageInput = messageInput1.trim();
    const conversationId =conversationId1// this.props.getConversationId();
    const textMessage = new CometChat.TextMessage(
      receiverId1,
      messageInput,
      receiverType1,
    );
    // if (this.props.parentMessageId) {
    //   textMessage.setParentMessageId(this.props.parentMessageId);
    // }
console.log('5330',this.loggedInUser,textMessage);
    textMessage.setSender(this.loggedInUser);
    textMessage.setReceiver(receiverType1);
    textMessage.setText(messageInput);
    textMessage.setConversationId(conversationId);
    textMessage._composedAt = Date.now();
    textMessage._id = '_' + Math.random().toString(36).substr(2, 9);
    textMessage.setId(textMessage._id)
//     this.props.actionGenerated(actions.MESSAGE_COMPOSED, [textMessage]);
//     this.setState({ messageInput: '', replyPreview: false });

// this.setState({
// vallength:0,
// newdataBeflist:[],
// newdatalist:this.state.dataTitle,
// })


//     this.messageInputRef.current.textContent = '';
//     this.playAudio();
    console.log('550',textMessage);
    CometChat.sendMessage(textMessage)
      .then((message) => {
        console.log('4800',message);
        this.showmessageDisappearing()
        this.goBack()
        // this.props.navigation.navigate("CometChatConversationListWithMessages")
    //     ////// BURADA ÇALIŞMA VAR
    //  if(  this.props.explod){
    // var zamman=  this.disappearingmessages(this.state.selectzaman)
    //   console.log('536',zamman);
    //   CometChat.callExtension('disappearing-messages','DELETE','v1/disappear',{
    //     msgId: message.id, // The id of the message that was just sent
    //     timeInMS: zamman // Time in milliseconds. Should be a time from the future.
    //   }).then(response => {
    //     console.log('541',response);
    //     this.showmessageDisappearing()

    //     // Successfully scheduled for deletion
    //   })
    //  }
        

        ///////
        // const newMessageObj = { ...message, _id: textMessage._id };
        // this.setState({ messageInput: '' });
        // this.messageInputRef.current.textContent = '';
        // // this.playAudio();
        // this.props.actionGenerated(actions.MESSAGE_SENT, newMessageObj);
      })
      .catch((error) => {
        Alert.alert("İşlem tamamlanamadı")
        // const newMessageObj = { ...textMessage, error: error };
        // this.props.actionGenerated(
        //   actions.ERROR_IN_SEND_MESSAGE,
        //   newMessageObj,
        // );
        // logger('Message sending failed with error:', error);
        // const errorCode = error?.message || 'ERROR';
        // this.props?.showMessage('error', errorCode);
      });
  } catch (error) {
    logger(error);
  }
};

///
  /**
   * Handle clicking on list item
   * @param conversation: conversation object of the item clicked
   */
  handleClick = (conversation) => {
    console.log('bass',this.props.selecttextmessage,conversation );
    this.setState({selectitem:conversation})
    this.sendTextMessage(conversation)
//     try {
//       if (!this.props.onItemClick) return;
// console.log('816');
//       this.props.onItemClick(
//         conversation.conversationWith,
//         conversation.conversationType,
//       );
//     } catch (error) {
//       logger(error);
//     }
  };

  /**
   * Retrieve conversation list according to the logged in user
   * @param
   */
  getConversations = () => {
    new CometChatManager()
      .getLoggedInUser()
      .then((user) => {
        this.loggedInUser = user;
        this.ConversationListManager.fetchNextConversation()
          .then((conversationList) => {
            console.log('8422',conversationList);
            if (conversationList.length === 0) {
              this.decoratorMessage = 'Sohbet bulunamadı';
            }
            this.setState({
              conversationList: [
                ...this.state.conversationList,
                ...conversationList,
              ],
            });
            if(this.state.searchQuery.length==0){
           this.setState({
            filteredConversationList: [
              ...this.state.conversationList,
              ...conversationList,
            ],
          })
        }

          })
          .catch((error) => {
            this.decoratorMessage = 'Error';
            const errorCode = error?.message || 'ERROR';
            this.dropDownAlertRef?.showMessage('error', errorCode);
            logger(
              '[CometChatConversationList] getConversations fetchNext error',
              error,
            );
          });
      })
      .catch((error) => {
        this.decoratorMessage = 'Error';
        logger(
          '[CometChatConversationList] getConversations getLoggedInUser error',
          error,
        );
      });
  };

  /**
   * header component for conversation list
   * @param
   */
  listHeaderComponent = () => {
    //list header avatar here.
    return (
      <View style={[styles.conversationHeaderStyle,{}]}>
        <View style={styles.headingContainer}>
          <Text style={styles.conversationHeaderTitleStyle}>Emlak İşim Sohbet</Text>
        </View>
      </View>
    );
  };

  /**
   * component to show if conversation list length is 0
   * @param
   */
  listEmptyContainer = () => {
    // for loading purposes....
    return (
      <View style={[styles.contactMsgStyle,{flexDirection:"row",flex:1}]}>
        
          { this.decoratorMessage == 'Sohbet bulunamadı'? 
          <View style={{justifyContent:"center",alignContent:"center",}}>
            <View style={{flexDirection:"row",alignContent:"center",justifyContent:"center",paddingBottom:22}}>
             <Image
           resizeMode="contain"
           source={assets.apartment}
           style={styles1.noApartments}
           />
           </View>
          <Text style={[
            styles.contactMsgTxtStyle,
            {
              color: `${this.theme.color.secondary}`,
            },
          ]}> { this.decoratorMessage}</Text>
          </View>
         :
         <Text
         style={[
           styles.contactMsgTxtStyle,
           {
             color: `${this.theme.color.secondary}`,
           },
         ]}>
          { this.decoratorMessage}
        </Text>}
         </View>

    );
  };

  /**
   * component for separating 2 conversation list items
   * @param
   */
  itemSeparatorComponent = ({ leadingItem }) => {
    if (leadingItem.header) {
      return null;
    }
    return (
      <View
        style={[
          styles.itemSeperatorStyle,
          {
            borderBottomColor: this.theme.borderColor.primary,
          },
        ]}
      />
    );
  };

  /**
   * check if scroll reached a particular point to handle headers
   * @param
   */
  handleScroll = ({ nativeEvent }) => {
    if (nativeEvent.contentOffset.y > 35 && !this.state.showSmallHeader) {
      this.setState({
        showSmallHeader: true,
      });
    }
    if (nativeEvent.contentOffset.y <= 35 && this.state.showSmallHeader) {
      this.setState({
        showSmallHeader: false,
      });
    }
  };

  /**
   * Handle end reached of conversation list
   * @param
   */
  endReached = () => {
    this.getConversations();
  };

  deleteConversations = (conversation) => {
    let conversationWith =
      conversation.conversationType === CometChat.RECEIVER_TYPE.GROUP
        ? conversation?.conversationWith?.guid
        : conversation?.conversationWith?.uid;
    CometChat.deleteConversation(
      conversationWith,
      conversation.conversationType,
    )
      .then((deletedConversation) => {
        const newConversationList = [...this.state.conversationList];
        const conversationKey = newConversationList.findIndex(
          (c) => c.conversationId === conversation.conversationId,
        );

        newConversationList.splice(conversationKey, 1);
        this.setState({ conversationList: newConversationList,
         });
      })
      .catch((error) => {
        logger(error);
      });
  };
   goBack = () => {
    const {navigation} = this.props;
      // const { onGoBack } = route.params; 

    // const {onGoBack} ;
    // if (route.params.onGoBack) {
    //   route.params.onGoBack("1");
    // }
    // console.log('1138',this.props);
    navigation.goBack();
}
handleSearch = (text) => {
  // if(text.length){
    let filteredList = [];
    for (let i = 0; i < this.state.conversationList.length; i++) {
      let item = this.state.conversationList[i];
      console.log('1008', item.conversationWith.name, text);
      if (item?.conversationWith.name.toLowerCase().includes(text.toLowerCase())) {
        filteredList.push(item);
      }
    }
    
  console.log('1021',filteredList);
  this.setState({ filteredConversationList: filteredList, searchQuery: text });
  //  }else{
  //   this.setState({ filteredConversationList: this.state.conversationList, searchQuery: "" });
  //  }
}
  render() {
console.log('1022',this.state.selectitem.conversationId);
console.log('1023',this.props.selecttextmessage);
    return (

      <CometChatContextProvider ref={(el) => (this.contextProviderRef = el)}>
        <SafeAreaView style={{ backgroundColor: 'white' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.conversationWrapperStyle]}>
            {/* <View style={[styles.headerContainer,{backgroundColor:"red"}]}></View> */}
        
           {/* {1- GERİ GİT} */}
           <View style={{flexDirection:"row"}}>
           <TouchableOpacity style={[styles1.closeIcon,{}]} onPress={this.goBack}>
            <View style={styles1.closeIcon1}>
              <Image
                source={assets.back}
                resizeMode="contain"
                style={styles1.imageIcon}
              />
              </View>
            </TouchableOpacity>
            <View style={{alignContent:"center",flexDirection:"row",justifyContent:"center",paddingLeft:22,paddingTop:5}}><Text style={{color:constants.darkblack,fontSize:20,fontWeight:"bold",paddingVertical:11}}>Mesajı İlet</Text></View>
            </View>
            <View style={{  borderColor: 'gray', marginHorizontal:15,borderWidth: 1,padding:15,borderRadius:6,marginBottom:15 }}>
            <TextInput
              style={{flexDirection:"column"}}
              onChangeText={text => this.handleSearch(text)}
              value={this.state.searchQuery}
              placeholder="Ara"
            />
            </View>
            {/* {this.listHeaderComponent()} */}
            <SwipeListView
              contentContainerStyle={styles.flexGrow1}
              data={this.state.filteredConversationList}
              keyExtractor={(item, index) => item?.conversationId + '_' + index}
              renderHiddenItem={(data, rowMap) => (
                <View
                  key={data.item?.conversationId}
                  style={{
                    alignItems: 'center',
                    flex: 1,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingLeft: 15,
                    
                  }}>
                  <TouchableOpacity
                    style={{
                      alignItems: 'center',
                      bottom: 0,
                      justifyContent: 'center',
                      position: 'absolute',
                      top: 0,
                      width: 75,
                      backgroundColor: 'red',
                      right: 0,
                      maxHeight: 64,
                    }}
                    onPress={() => this.deleteConversations(data.item)}>
                    <Image
                      source={require('./resources/delete.png')}
                      resizeMode="contain"
                      style={{ height: 24 }}
                    />
                    <Text style={styles.deleteText}>Sil</Text>
                  </TouchableOpacity>
                </View>
              )}
              leftOpenValue={0}
              rightOpenValue={-75}
              previewRowKey={'0'}
              previewOpenValue={-40}
              previewOpenDelay={3000}
              renderItem={({ item }) => {
                // console.log('1112',item);
                
                return (
                  
                    // <View style={{backgroundColor: this.state.selectitem.conversationId==item?.conversationId?"grey":"white"}}>
                  <CometChatConversationListItem
                    theme={this.theme}
                    config={this.props.config}
                    conversation={item}
                    selectedConversation={this.state.selectedConversation}
                    loggedInUser={this.loggedInUser}
                    handleClick={this.handleClick}
                    select={this.state.selectitem.conversationId==item?.conversationId?true:false}
                  />
                );
              }}
              ListEmptyComponent={this.listEmptyContainer}
              onScroll={this.handleScroll}
              onEndReached={this.endReached}
              onEndReachedThreshold={0.3}
              showsVerticalScrollIndicator={false}
              scrollEnabled
            />
          </KeyboardAvoidingView>
          <DropDownAlert ref={(ref) => (this.dropDownAlertRef = ref)} />
        </SafeAreaView>
      </CometChatContextProvider>

    );
  }
}
const styles1 = StyleSheet.create({
  closeIcon: {
   // position: 'absolute',
    // top: 27 * heightRatio,
    left: 14 * widthRatio,
    // backgroundColor: constants.grey,
    width: 44 * heightRatio,
    height: 44 * heightRatio,
    borderRadius: 22 * heightRatio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon1: {
    // position: 'absolute',
    // top: 34 * heightRatio,
    // left: 25 * widthRatio,
    backgroundColor: constants.grey,
    width: 30 * heightRatio,
    height: 30 * heightRatio,
    borderRadius: 15 * heightRatio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIcon: {
    height: 14 * heightRatio,
    width: 14 * heightRatio,
  },
  noApartments: {
    height: 120 * heightRatio,
    width: 120 * heightRatio,
  
  },
})
export default CometChatConversationList;
