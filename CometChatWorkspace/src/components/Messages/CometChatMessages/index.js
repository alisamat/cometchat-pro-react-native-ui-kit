/* eslint-disable react/no-unused-state */
/* eslint-disable react/no-did-update-set-state */
import React from 'react';
import {
  View,
  SafeAreaView,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  StyleSheet,
  Text
} from 'react-native';
import {observer, inject} from 'mobx-react';
import {getSnapshot} from 'mobx-state-tree';

import { CometChat } from '@cometchat-pro/react-native-chat';
// import { NavigationContainer } from '@react-navigation/native';
import * as actions from '../../../utils/actions';
import _ from 'lodash';
import {
  CometChatContextProvider,
  CometChatContext,
} from '../../../utils/CometChatContext';
import CometChatUserDetails from '../../Users/CometChatUserDetails';
import CometChatLiveReactions from '../CometChatLiveReactions';
import CometChatMessageHeader from '../CometChatMessageHeader';
import CometChatMessageList from '../CometChatMessageList';
import CometChatMessageComposer from '../CometChatMessageComposer';
import CometChatMessageActions from '../CometChatMessageActions';
import CometChatMessageThread from '../CometChatMessageThread';
import CometChatImageViewer from '../CometChatImageViewer';
import {
  CometChatIncomingCall,
  CometChatOutgoingCall,
  CometChatOutgoingDirectCall,
  CometChatIncomingDirectCall,
} from '../../Calls';
import CometChatGroupDetails from '../../Groups/CometChatGroupDetails';
import CometChatVideoViewer from '../CometChatVideoViewer';
import theme from '../../../resources/theme';
import { CometChatManager } from '../../../utils/controller';
import * as enums from '../../../utils/enums';
import { checkMessageForExtensionsData, logger } from '../../../utils/common';
import DropDownAlert from '../../Shared/DropDownAlert';
import BottomSheet from 'reanimated-bottom-sheet';
import style from './styles';
import CometChatUserProfile from '../../Users/CometChatUserProfile';
import User from '../../../../../../store/user';
import Apartments from '../../../../../../store/apartment';
import General from '../../../../../../store/general';
import checkPackageValidity from '../../../../../../Components/paket'

class CometChatMessages extends React.PureComponent {
  static contextType = CometChatContext;

  loggedInUser = null;
  constructor(props) {
    super(props);
    const { route } = props;
    const params = route?.params || props;
    this.state = {
      leftsendtextMessage:{},
      refress:false,
      selectedtextmessage:[],
      explod:false,
      anket:false,
      aoutowrite:true,
      messageList: [],
      scrollToBottom: true,
      messageToBeEdited: '',
      replyPreview: null,
      tab: 'conversations',
      item: params.item,
      liveReaction: false,
      messageToReact: null,
      threadMessageView: false,
      threadMessageType: null,
      threadMessageItem: {},
      threadMessageParent: {},
      userDetailVisible: false,
      groupDetailVisible: false,
      user: params.type === 'user' ? params.item : null,
      showProfile: false,
      ongoingDirectCall: false,
      imageView:null,
      joinDirectCall:false,
      outgoingCall: null,
      incomingCall: null,
      ongoingDirectCall: null,
      pinadd:0,
      gecicialan:false,
      paket:false,
    };

    this.composerRef = React.createRef();
    this.sheetRef = React.createRef(null); /// //ref here

    this.reactionName = props.reaction || 'heart';
    this.theme = { ...theme, ...params.theme };
  }
 gecicalancheckandpaketcheck(){
  const {general,user}=this.props
  console.log('1011',general);
  let generaldetail = getSnapshot(general);
  var gecicialan=generaldetail.generalsList[0].General?.gecicialan   
  console.log('1077',gecicialan); 
  if(gecicialan=="true"){
      this.setState({gecicialan:true})
    }

      var startpackage=generaldetail.generalsList[0].General?.startpackage   
        if(startpackage=="notpackage"){
          this.setState({paket:true})

        }else {
        let userdetail = getSnapshot(user);
        var paketdet=userdetail.paket
        var paket=  checkPackageValidity(paketdet)
            if(paket.paket!=="Standart"){
            this.setState({paket:true})
            }else{
              this.setState({paket:false})
            }
        }
       
 }
  componentDidMount() {
    ////
    this.gecicalancheckandpaketcheck()
    /////
    this.checkRestrictions();
    new CometChatManager()
      .getLoggedInUser()
      .then((user) => {
        this.loggedInUser = user;
      })
      .catch(() => {
         logger('[CometChatMessages] getLoggedInUser error', error);
      });
  }
  checkRestrictions = async () => {
    let context = this.contextProviderRef.state;
    let isGroupActionMessagesEnabled =
      await context.FeatureRestriction.isGroupActionMessagesEnabled();
    let isCallActionMessagesEnabled =
      await context.FeatureRestriction.isCallActionMessagesEnabled();
    let isOneOnOneChatEnabled =
      await context.FeatureRestriction.isOneOnOneChatEnabled();
    let isGroupChatEnabled =
      await context.FeatureRestriction.isGroupChatEnabled();
    let isHideDeletedMessagesEnabled =
      await context.FeatureRestriction.isHideDeletedMessagesEnabled();
    this.setState({
      restrictions: {
        isGroupActionMessagesEnabled,
        isCallActionMessagesEnabled,
        isOneOnOneChatEnabled,
        isGroupChatEnabled,
        isHideDeletedMessagesEnabled,
      },
    });
  };

  componentDidUpdate(prevProps, prevState) {
    const { route: prevRoute } = prevProps;
    const { route } = this.props;
    const params = route?.params || this.props;
    const prevParams = prevRoute?.params || prevProps;

    if (!prevState.threadMessageView && this.state.threadMessageView) {
      this.sheetRef.current.snapTo(0);
    }
    if (params.type === 'user' && prevParams.item.uid !== params.item.uid) {
      this.setState({
        messageList: [],
        scrollToBottom: true,
        messageToBeEdited: '',
      });
      // this.setUserDetails()
    } else if (
      params.type === 'group' &&
      prevParams.item.guid !== params.item.guid
    ) {
      this.setState({
        messageList: [],
        scrollToBottom: true,
        messageToBeEdited: '',
      });
    } else if (prevParams.type !== params.type) {
      this.setState({
        messageList: [],
        scrollToBottom: true,
        messageToBeEdited: '',
      });
    } else if (
      prevState.composedThreadMessage !== this.state.composedThreadMessage
    ) {
      this.updateReplyCount(this.state.composedThreadMessage);
    } else if (prevParams.callMessage !== params.callMessage) {
      if (prevParams.callMessage.id !== params.callMessage.id) {
        this.actionHandler('callUpdated', params.callMessage);
      }
    }
  }

  deleteGroup = (group) => {
    this.setState(
      {
        groupDetailVisible: false,
        groupToDelete: group,
        item: {},
        type: 'group',
        viewDetailScreen: false,
      },
      () => {
        this.props.route?.params?.actionGenerated('groupDeleted', group) ||
          (this.props.actionGenerated &&
            this.props.actionGenerated('groupDeleted', group));
        this.props.navigation?.goBack();
      },
    );
  };

  leaveGroup = (group) => {
    this.setState(
      {
        groupDetailVisible: false,
        groupToLeave: group,
        item: {},
        type: 'group',
        viewDetailScreen: false,
      },
      () => {
        this.props.navigation?.goBack();
      },
    );
  };

  updateMembersCount = (item, count) => {
    const { route } = this.props;
    const params = route?.params || this.props;

    const group = { ...this.state.item, membersCount: count };
    this.setState({ item: group, groupToUpdate: group });
    params.actionGenerated('membersUpdated', item, count);
  };

  actionHandler = (action, messages, key, group, options) => {
    const { route } = this.props;
    const params = route?.params || this.props;
    switch (action) {
      case actions.CUSTOM_MESSAGE_RECEIVED:
      case actions.MESSAGE_RECEIVED:
        {
          const message = messages[0];
          if (message.parentMessageId) {
            this.updateReplyCount(messages);
          } else {
            this.smartReplyPreview(messages);
            this.appendMessage(messages);
          }
        }
        break;
      case actions.GROUP_DELETED:
        this.deleteGroup(messages);
        break;
      case actions.LEFT_GROUP:
        this.leaveGroup(messages);
        break;
      case actions.MEMBERS_UPDATED:
        this.updateMembersCount(messages, key);
        break;
      case actions.MESSAGE_READ:
        params.actionGenerated(action, messages);
        break;
      case actions.MESSAGE_SENT:
      case actions.ERROR_IN_SEND_MESSAGE:
        this.messageSent(messages);
      case actions.MESSAGE_COMPOSED: {
        this.appendMessage(messages);
        break;
      }
      case actions.VIEW_MESSAGE_THREAD:
        this.setState({ messageToReact: null }, () => {
          this.viewMessageThread(messages);
          // route.params.actionGenerated('viewMessageThread', messages);
        });
        break;
////////////////////////////
        case actions.VIEW_MESSAGE_PIN:
          this.setState({ messageToReact: null });
          this.viewmessagepin(messages);
          break;
////////////////////////////
//////////////// BURADA ÇALIŞMA
        case actions.AOUTO_WRİTE:
          console.log('253',);
           this.aoutowrite()
          // this.viewmessagepin(messages);
          break;


//////////////// BURADA ÇALIŞMA sonu

//////////////// BURADA ÇALIŞMA
case actions.EXPLOAD:
  console.log('253',);
   this.explod()
  // this.viewmessagepin(messages);
  break;

  case actions.ANKET:
  console.log('253',);
   this.anket()
  // this.viewmessagepin(messages);
  break;

  
//////////////// BURADA ÇALIŞMA sonu





      case actions.CLOSE_THREAD_CLICKED:
        this.closeThreadMessages();
        break;
      case actions.MESSAGE_UPDATED: {
        this.updateMessages(messages);
        break;
      }
      case actions.MESSAGE_FETCHED:
        this.prependMessages(messages);
        break;
      case actions.MESSAGE_FETCHED_AGAIN:
        this.prependMessagesAndScrollBottom(messages);
        break;
      case actions.MESSAGE_DELETED:
        this.removeMessages(messages);
        break;
      case actions.THREAD_MESSAGE_DELETED:
        params.actionGenerated(actions.MESSAGE_DELETED, messages);
        break;
      case actions.DELETE_MESSAGE:
        this.setState({ messageToReact: null });
        this.deleteMessage(messages);
        break;
      case actions.EDIT_MESSAGE:
        this.setState({ messageToReact: null });
        this.editMessage(messages);
        break;
      case actions.MESSAGE_EDITED:
        this.messageEdited(messages);
        break;
      case actions.CLEAR_EDIT_PREVIEW:
        this.clearEditPreview();
        break;
      case actions.GROUP_UPDATED:
        this.groupUpdated(messages, key, group, options);
        break;
      case actions.CALL_UPDATED:
        this.callUpdated(messages);
        break;
      case actions.POLL_ANSWERED:
        this.updatePollMessage(messages);
        break;
      case actions.POLL_CREATED:
        this.appendPollMessage(messages);
        break;
      case actions.VIEW_ACTUAL_IMAGE:
        this.setState({ imageView: messages});
        break;
      case actions.VIEW_ACTUAL_VIDEO:
        this.setState({ videoMessage: messages });
        break;
      case actions.AUDIO_CALL:
      case actions.VIDEO_CALL:
        if (params.type === CometChat.RECEIVER_TYPE.GROUP) {
          this.setState({ joinDirectCall: false, ongoingDirectCall: true });
        } else {
          params.actionGenerated(action, { ...params.item, type: params.type });
        }
        break;
      case actions.MENU_CLICKED:
        // case actions.JOIN_DIRECT_CALL:
        params.actionGenerated(action);
        break;
      case actions.SEND_REACTION:
        this.toggleReaction(true);
        break;
      case actions.SHOW_REACTION:
        this.showReaction(messages);
        break;
      case actions.STOP_REACTION:
        this.toggleReaction(false);
        break;
      case actions.REACT_TO_MESSAGE:
        this.reactToMessage(messages);
        break;
      case actions.GO_BACK:
        this.props.navigation?.goBack();
        break;
      case actions.CLOSE_DETAIL:
        this.setState({ userDetailVisible: false, groupDetailVisible: false });
        break;
      case actions.VIEW_DETAIL:
        if (params.type === CometChat.RECEIVER_TYPE.USER) {
          this.setState({ userDetailVisible: true });
        } else {
          this.setState({ groupDetailVisible: true });
        }
        break;
      case actions.BLOCK_USER:
        this.blockUser();
        break;
      case actions.UNBLOCK_USER:
        this.unblockUser();
        break;
      case actions.CLOSE_MESSAGE_ACTIONS:
        this.setState({ messageToReact: null });
        break;
      case actions.OPEN_MESSAGE_ACTIONS:
        this.setState({ messageToReact: messages });
        break;

        case actions.SELECTED_MESSAGE:
          console.log('3899',messages);
           this.setState({ selectedtextmessage: messages });
          break;
  


      case actions.UPDATE_THREAD_MESSAGE:
        this.updateThreadMessage(messages[0], key);
        break;
      case actions.THREAD_MESSAGE_COMPOSED:
        this.onThreadMessageComposed(messages);
        params.actionGenerated(actions.THREAD_MESSAGE_COMPOSED, messages);
        // this.updateLastMessage(item[0]);
        break;
      case actions.MEMBER_SCOPE_CHANGED:
        this.memberScopeChanged(messages);
        break;
      case actions.MEMBERS_REMOVED:
        this.membersRemoved(messages);
        break;
      case actions.MEMBERS_ADDED:
        this.membersAdded(messages);
        break;
      case actions.MEMBER_BANNED:
        this.memberBanned(messages);
        break;
      case actions.MEMBER_UNBANNED:
        this.memberUnbanned(messages);
        break;
      case actions.SEND_MESSAGE:
        this.setState({ messageToReact: null });
        this.sendMessage(messages);
        break;
      case actions.SHOW_PROFILE:
        this.showProfile();
        break;
      case actions.ACCEPT_INCOMING_CALL:
        this.setState({ incomingCall: messages});
        this.appendMessage([messages])
        break;
      case actions.CALL_ENDED:
      case actions.OUTGOING_CALL_REJECTED:
      case actions.OUTGOING_CALL_CANCELLED:
        params.actionGenerated(action, messages);
        break;
      case actions.REJECTED_INCOMING_CALL:
        params.actionGenerated(action, messages, key);
        break;
      case actions.ACCEPT_DIRECT_CALL:
        this.setState({joinDirectCall: true}, () => {
          if (params.type === CometChat.RECEIVER_TYPE.GROUP)
            this.setState({ongoingDirectCall: true})
        })
        break;
      case actions.JOIN_DIRECT_CALL:
        this.setState({ joinDirectCall: true }, () => {
          this.setState({ ongoingDirectCall: true });
        });
        break;
      case actions.DIRECT_CALL_ENDED:
        this.setState({ joinDirectCall: false, ongoingDirectCall: null });

        break;
      case enums.TRANSIENT_MESSAGE_RECEIVED:
        this.liveReactionReceived(messages);
        break;
      case actions.STATUS_UPDATED:
        this.setState({ user: { ...this.state.user, status: messages } });

        break;
      default:
        break;
    }
  };
  
  aoutowrite=()=>{
    console.log('6599',);
  
    var resaoutowrite=this.state.aoutowrite?false:true
    this.setState({ aoutowrite: resaoutowrite });
   
  }
  
  explod=()=>{
    console.log('4544',);
  
    var explod=this.state.explod?false:true
    this.setState({ explod: explod });
   
  }
  
  anket=()=>{
    console.log('4777',);
  
    var anket=this.state.anket?false:true
    this.setState({ anket: anket });
  //  this.props.toggleCreatePoll()
  }
  
  sendMessage = (message) => {
    const { route } = this.props;

    const params = route?.params || this.props;

    this.props.navigation.push(enums.NAVIGATION_CONSTANTS.COMET_CHAT_MESSAGES, {
      theme: params.theme,
      item: { ...message.sender },
      type: CometChat.RECEIVER_TYPE.USER,
      loggedInUser: params.loggedInUser,
      actionGenerated: params.actionGenerated,
    });
  };

  showProfile = () => {
    this.setState({
      userDetailVisible: false,
      groupDetailVisible: false,
      showProfile: true,
    });
  };

  messageSent = (message) => {
    const messageList = [...this.state.messageList];

    let messageKey = messageList.findIndex((m) => m._id === message._id);
    if (messageKey > -1) {
      const newMessageObj = { ...message };

      messageList.splice(messageKey, 1, newMessageObj);

      messageList.sort((a, b) => a.id - b.id);
      this.setState({ messageList: [...messageList] });
    }
  };

  memberUnbanned = (members) => {
    if (!this.state.restrictions?.isGroupActionMessagesEnabled) {
      return false;
    }
    const messageList = [...this.state.messageList];
    let filteredMembers = _.uniqBy(members, 'id');
    filteredMembers.forEach((eachMember) => {
      const message = `${this.loggedInUser.name} unbanned ${eachMember.name}`;
      const sentAt = (new Date() / 1000) | 0;
      const messageObj = {
        category: 'action',
        message: message,
        type: enums.ACTION_TYPE_GROUPMEMBER,
        sentAt: sentAt,
      };
      messageList.push(messageObj);
    });

    this.setState({ messageList: messageList });
  };

  liveReactionReceived = (reaction) => {
    try {
      const stopReaction = () => {
        this.toggleReaction(false);
      };

      if (reaction.data.type === enums['METADATA_TYPE_LIVEREACTION']) {
        const params = this.props?.route?.params || this.props;

        if (
          (params.type === CometChat.RECEIVER_TYPE.GROUP &&
            reaction.getReceiverId() === params.item.guid) ||
          (params.type === CometChat.RECEIVER_TYPE.USER &&
            reaction.getSender()?.uid === params.item.uid)
        ) {
          this.reactionName = reaction.data.reaction;
          this.toggleReaction(true);

          const liveReactionInterval = 1000;
          setTimeout(stopReaction, liveReactionInterval);
        }
      }
    } catch (error) {
      logger(error);
    }
  };

  membersAdded = (members) => {
    if (!this.state.restrictions?.isGroupActionMessagesEnabled) {
      return false;
    }
    const messageList = [...this.state.messageList];
    members.forEach((eachMember) => {
      // const message = `${this.loggedInUser.name} added ${eachMember.name}`;
      const message = `${this.loggedInUser.name}, ${eachMember.name}'ı ekledi`;
      const sentAt = (new Date() / 1000) | 0;
      const messageObj = {
        category: 'action',
        message,
        type: enums.ACTION_TYPE_GROUPMEMBER,
        sentAt,
      };
      messageList.push(messageObj);
    });

    this.setState({ messageList: messageList });
  };

  membersRemoved = (members) => {
    if (!this.state.restrictions?.isGroupActionMessagesEnabled) {
      return false;
    }
    const messageList = [...this.state.messageList];
    let filteredMembers = _.uniqBy(members, 'id');
    filteredMembers.forEach((eachMember) => {
      const message = `${this.loggedInUser.name} kicked ${eachMember.name}`;
      const sentAt = (new Date() / 1000) | 0;
      const messageObj = {
        category: 'action',
        message: message,
        type: enums.ACTION_TYPE_GROUPMEMBER,
        sentAt: sentAt,
      };
      messageList.push(messageObj);
    });

    this.setState({ messageList: messageList });
  };

  memberScopeChanged = (members) => {
    if (!this.state.restrictions?.isGroupActionMessagesEnabled) {
      return false;
    }
    const messageList = [...this.state.messageList];
    let filteredMembers = _.uniqBy(members, 'id');
    filteredMembers.forEach((eachMember) => {
      const message = `${this.loggedInUser.name} made ${eachMember.name} ${eachMember.scope}`;
      const sentAt = (new Date() / 1000) | 0;
      const messageObj = {
        category: 'action',
        message: message,
        type: enums.ACTION_TYPE_GROUPMEMBER,
        sentAt: sentAt,
      };
      messageList.push(messageObj);
    });

    this.setState({ messageList: messageList });
  };

  memberBanned = (members) => {
    if (!this.state.restrictions?.isGroupActionMessagesEnabled) {
      return false;
    }
    const messageList = [...this.state.messageList];
    members.forEach((eachMember) => {
      const message = `${this.loggedInUser.name} banned ${eachMember.name}`;
      const sentAt = (new Date() / 1000) | 0;
      const messageObj = {
        category: 'action',
        message,
        type: enums.ACTION_TYPE_GROUPMEMBER,
        sentAt,
      };
      messageList.push(messageObj);
    });

    this.setState({ messageList: messageList });
  };

  closeThreadMessages = () => {
    this.setState({ viewDetailScreen: false, threadMessageView: false });
  };

  viewMessageThread = (parentMessage) => {
    const { route } = this.props;
    const params = route?.params || this.props;
    const message = { ...parentMessage };
    const threadItem = { ...this.state.item };
    this.setState({
      threadMessageView: true,
      threadMessageParent: message,
      threadMessageItem: threadItem,
      threadMessageType: params.type,
      viewDetailScreen: false,
    });
  };

  viewmessagepin=(message)=>{
   console.log('6055',message);
   var pinadd=this.state.pinadd
   pinadd=pinadd+1
   this.setState({pinadd})
  }

  onThreadMessageComposed = (composedMessage) => {
    const { route } = this.props;
    const params = route?.params || this.props;

    if (params.type !== this.state.threadMessageType) {
      return false;
    }

    if (
      (this.state.threadMessageType === 'group' &&
        this.state.item.guid !== this.state.threadMessageItem.guid) ||
      (this.state.threadMessageType === 'user' &&
        this.state.item.uid !== this.state.threadMessageItem.uid)
    ) {
      return false;
    }

    const message = { ...composedMessage };
    this.setState({ composedThreadMessage: message });
  };

  blockUser = () => {
    const { route } = this.props;
    const params = route?.params || this.props;

    const usersList = [this.state.item.uid];
    CometChatManager.blockUsers(usersList)
      .then((response) => {
        this.dropDownAlertRef?.showMessage('success', 'Blocked user');
        this.setState({ user: { ...this.state.item, blockedByMe: true } });
        params.actionGenerated('blockUser');
      })
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
        logger('Blocking user fails with error', error);
      });
  };

  unblockUser = () => {
    const { route } = this.props;
    const params = route?.params || this.props;

    const usersList = [this.state.item.uid];
    CometChatManager.unblockUsers(usersList)
      .then(() => {
        this.setState({ user: { ...this.state.item, blockedByMe: false } });
        params.actionGenerated('unblockUser');
      })
      .catch((error) => {
       logger('unblocking user fails with error', error);
      });
  };

  toggleReaction = (flag) => {
    this.setState({ liveReaction: flag });
  };

  showReaction = (reaction) => {
    if (!Object.prototype.hasOwnProperty.call(reaction, 'metadata')) {
      return false;
    }

    if ( reaction.metadata === undefined ||
      !Object.prototype.hasOwnProperty.call(reaction.metadata, 'type') ||
      !Object.prototype.hasOwnProperty.call(reaction.metadata, 'reaction')
    ) {
      return false;
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        enums.LIVE_REACTIONS,
        reaction.metadata.reaction,
      )
    ) {
      return false;
    }

    if (reaction.metadata.type === enums.LIVE_REACTION_KEY) {
      this.reactionName = reaction.metadata.reaction;
      this.setState({ liveReaction: true });
    }
  };

  updateThreadMessage = (message, action) => {
    if (this.state.threadMessageView === false) {
      return false;
    }

    if (action === 'delete') {
      this.setState({
        threadMessageParent: { ...message },
        threadMessageView: false,
      });
    } else {
      this.setState({ threadMessageParent: { ...message } });
    }
  };

  deleteMessage = (message) => {
    const { route } = this.props;
    const params = route?.params || this.props;

    const messageId = message.id;
    CometChat.deleteMessage(messageId)
      .then((deletedMessage) => {
        this.removeMessages([deletedMessage]);

        const messageList = [...this.state.messageList];
        const messageKey = messageList.findIndex((m) => m.id === message.id);

        this.actionHandler('updateThreadMessage', [deletedMessage], 'delete');
        params.actionGenerated(
          'updateThreadMessage',
          [deletedMessage],
          'delete',
        );

        if (messageList.length - messageKey === 1 && !message.replyCount) {
          params.actionGenerated('messageDeleted', [deletedMessage]);
        }
      })
      .catch(() => {});
  };

  editMessage = (message) => {
    this.setState({ messageToBeEdited: message, replyPreview: null });
  };

  messageEdited = (message) => {
    const { route } = this.props;
    const params = route?.params || this.props;

    const messageList = [...this.state.messageList];
    const messageKey = messageList.findIndex((m) => m.id === message.id);
    if (messageKey > -1) {
      const messageObj = messageList[messageKey];

      const newMessageObj = { ...messageObj, ...message };

      messageList.splice(messageKey, 1, newMessageObj);
      this.updateMessages(messageList);

      params.actionGenerated('updateThreadMessage', [newMessageObj], 'edit');

      if (messageList.length - messageKey === 1 && !message.replyCount) {
        params.actionGenerated('messageEdited', [newMessageObj]);
      }
    }
  };

  updatePollMessage = (message) => {
    const messageList = [...this.state.messageList];
    const messageId = message.poll.id;
    const messageKey = messageList.findIndex((m) => m.id === messageId);
    if (messageKey > -1) {
      const messageObj = messageList[messageKey];

      const metadataObj = {
        '@injected': { extensions: { polls: message.poll } },
      };

      const newMessageObj = { ...messageObj, metadata: metadataObj };

      messageList.splice(messageKey, 1, newMessageObj);
      this.updateMessages(messageList);
    }
  };

  appendPollMessage = (messages) => {
    this.appendMessage(messages);
  };

  // messages are deleted
  removeMessages = (messages) => {
    const deletedMessage = messages[0];
    const messageList = [...this.state.messageList];

    const messageKey = messageList.findIndex(
      (message) => message.id === deletedMessage.id,
    );
    if (messageKey > -1) {
      const messageObj = { ...messageList[messageKey] };
      const newMessageObj = { ...messageObj, ...deletedMessage };
      if (this.state.restrictions?.isHideDeletedMessagesEnabled) {
        messageList.splice(messageKey, 1);
      } else {
        messageList.splice(messageKey, 1, newMessageObj);
      }
      this.setState({ messageList: messageList, scrollToBottom: false });
    }
  };

  // messages are fetched from backend
  prependMessages = (messages) => {
    const messageList = [...messages, ...this.state.messageList];
    this.setState({ messageList, scrollToBottom: false });
  };

  prependMessagesAndScrollBottom = (messages) => {
    const messageList = [...messages, ...this.state.messageList];
    this.setState({ messageList, scrollToBottom: true });
  };

  // message is received or composed & sent
  appendMessage = (newMessages = []) => {
    if (
      this.state.messageList &&
      newMessages.length &&
      this.state.messageList.length &&
      this.state.messageList.length &&
      newMessages[newMessages.length - 1].id ===
        this.state.messageList[this.state.messageList.length - 1].id
    ) {
      return;
    }
    let messages = [...this.state.messageList];
    // messages = messages.reverse();
    messages = messages.concat(newMessages);
    messages = _.uniqBy(messages, 'id');

    this.setState({ messageList: messages, scrollToBottom: true });
  };

  // message status is updated
  updateMessages = (messages) => {
    this.setState({ messageList: messages, scrollToBottom: false });
  };

  groupUpdated = (message, key, group, options) => {
    const { route } = this.props;
    const params = route?.params || this.props;

    switch (key) {
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_KICKED: {
        if (options.user.uid === this.loggedInUser.uid) {
          this.setState({ item: {}, type: 'group', viewDetailScreen: false });
        }
        break;
      }
      case enums.GROUP_MEMBER_SCOPE_CHANGED: {
        if (options.user.uid === this.loggedInUser.uid) {
          const newObj = { ...this.state.item, scope: options.scope };
          this.setState({
            item: newObj,
            type: 'group',
            viewDetailScreen: false,
          });
        }
        break;
      }
      default:
        break;
    }

    params.actionGenerated('groupUpdated', message, key, group, options);
  };

  callUpdated = (message) => {
    const {status, callInitiator} = message
    switch (status) {
      case CometChat.CALL_STATUS.INITIATED:
        if (callInitiator.uid === this.loggedInUser.uid) {
          this.setState({outgoingCall: message})
        }
        break;
      case CometChat.CALL_STATUS.BUSY:
      case CometChat.CALL_STATUS.CANCELLED:
      case CometChat.CALL_STATUS.ENDED:
      case CometChat.CALL_STATUS.REJECTED:
      case CometChat.CALL_STATUS.UNANSWERED:
        this.setState({outgoingCall: null, incomingCall: null})
      default:
        break;
    }
    this.appendMessage([message]);
  };

  updateReplyCount = (messages) => {
    const receivedMessage = messages[0];

    const messageList = [...this.state.messageList];
    const messageKey = messageList.findIndex(
      (m) => m.id === receivedMessage.parentMessageId,
    );
    if (messageKey > -1) {
      const messageObj = messageList[messageKey];
      let replyCount = Object.prototype.hasOwnProperty.call(
        messageObj,
        'replyCount',
      )
        ? messageObj.replyCount
        : 0;
      replyCount += 1;
      const newMessageObj = { ...messageObj, replyCount };

      messageList.splice(messageKey, 1, newMessageObj);
      this.setState({ messageList, scrollToBottom: false });
    }
  };

  smartReplyPreview = (messages) => {
    const { route } = this.props;
    const params = route?.params || this.props;

    const message = messages[0];
    if (
      message.sender.uid === params.loggedInUser.uid ||
      message.category === CometChat.MESSAGE_TYPE.CUSTOM
    ) {
      return false;
    }

    const smartReplyData = checkMessageForExtensionsData(
      message,
      'smart-reply',
    );
    if (
      smartReplyData &&
      Object.prototype.hasOwnProperty.call(smartReplyData, 'error') === false
    ) {
      this.setState({ replyPreview: message });
    } else {
      this.setState({ replyPreview: null });
    }
  };

  clearEditPreview = () => {
    this.setState({ messageToBeEdited: '' });
  };

  reactToMessage = (message) => {
    this.setState({ messageToReact: message });
  };
  generateRandomColors = count => {
    const colors = [];

    for (let i = 0; i < count; i++) {
      const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      colors.push(color);
    }

    return colors;
  };

  getConversationId = () => {
    const { route } = this.props;
    const params = route?.params || this.props;
    let conversationId = null;
    if (params.type === CometChat.RECEIVER_TYPE.USER) {
      const users = [this.loggedInUser.uid, params.item.uid];
      conversationId = users.sort().join('_user_');
    } else if (params.type === CometChat.RECEIVER_TYPE.GROUP) {
      conversationId = `group_${params.item.guid}`;
    }

    return conversationId;
  };
  selectShareLeft=(selecttext)=>{
    this.sendTextMessage(selecttext)
  }
  sendTextMessage1 = (item) => {
    
console.log('1044',item.rawMessage.receiver);
console.log('1044',item.rawMessage.data.text);
console.log('1044',item.rawMessage.receiverType);
console.log('1044',item.rawMessage.conversationId);
    try {
      let receiverId1=item.rawMessage.receiver
      let  messageInput1=item.rawMessage.data.text
      let  receiverType1=item.rawMessage.receiverType
      let conversationId1=item.rawMessage.conversationId
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
          console.log('1104',message);
          this.setState({refress:true})
          // this.showmessageDisappearing()
          // this.goBack()
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
  sendTextMessage = (item) => {
    
          let receiverId1=item.rawMessage.receiver
          let  messageInput1=item.rawMessage.data.text
          let  receiverType1=item.rawMessage.receiverType
          let conversationId1=item.rawMessage.conversationId
          if (!messageInput1.trim().length) {
            return false;
          }
          const messageInput = messageInput1.trim();
          const conversationId =conversationId1// this.props.getConversationId();
          const textMessage = new CometChat.TextMessage(
            receiverId1,
            messageInput,
            receiverType1,
          );
          textMessage.setSender(this.loggedInUser);
          textMessage.setReceiver(receiverType1);
          textMessage.setText(messageInput);
          textMessage.setConversationId(conversationId);
          textMessage._composedAt = Date.now();
          textMessage._id = '_' + Math.random().toString(36).substr(2, 9);
          textMessage.setId(textMessage._id)

          this.setState({leftsendtextMessage:textMessage})
          // CometChat.sendMessage(textMessage)
          //   .then((message) => {
          //     console.log('1104',message);
          //     this.setState({refress:true})
          //     // this.showmessageDisappearing()
          //     // this.goBack()
          //     // this.props.navigation.navigate("CometChatConversationListWithMessages")
          // //     ////// BURADA ÇALIŞMA VAR
          // //  if(  this.props.explod){
          // // var zamman=  this.disappearingmessages(this.state.selectzaman)
          // //   console.log('536',zamman);
          // //   CometChat.callExtension('disappearing-messages','DELETE','v1/disappear',{
          // //     msgId: message.id, // The id of the message that was just sent
          // //     timeInMS: zamman // Time in milliseconds. Should be a time from the future.
          // //   }).then(response => {
          // //     console.log('541',response);
          // //     this.showmessageDisappearing()
      
          // //     // Successfully scheduled for deletion
          // //   })
          // //  }
              
      
          //     ///////
          //     // const newMessageObj = { ...message, _id: textMessage._id };
          //     // this.setState({ messageInput: '' });
          //     // this.messageInputRef.current.textContent = '';
          //     // // this.playAudio();
          //     // this.props.actionGenerated(actions.MESSAGE_SENT, newMessageObj);
          //   })
          //   .catch((error) => {
          //     Alert.alert("İşlem tamamlanamadı")
          //     // const newMessageObj = { ...textMessage, error: error };
          //     // this.props.actionGenerated(
          //     //   actions.ERROR_IN_SEND_MESSAGE,
          //     //   newMessageObj,
          //     // );
          //     // logger('Message sending failed with error:', error);
          //     // const errorCode = error?.message || 'ERROR';
          //     // this.props?.showMessage('error', errorCode);
          //   });
       
      };
  selectShareRight=(selecttext)=>{
console.log('1044',selecttext.data.text);
    this.props.navigation.navigate(
    
      'cometchatuserlistselcet' ,
       {
         userids:[""],
         where:"chat",
         username:"",
         selecttext:selecttext.data.text,
         onGoBack:()=>{Alert.Alert("debe")}
       }
       
      // "chatuserlist"
      // // {
      // //   type,
      // //   item: { ...item },
      // //   theme: this.theme,
      // //   tab: this.state.tab,
      // //   loggedInUser: this.loggedInUser,
      // //   callMessage: this.state.callMessage,
      // //   actionGenerated: this.actionHandler,
      // //   composedThreadMessage: this.state.composedThreadMessage,
      // // },
    );
  }
  render() {
    // console.log('4256',this.props.route.params);
    const { route } = this.props;
    console.log('1033',this.props.navigation);
    const params = route?.params || this.props;
    let imageView = null;
    if (this.state.imageView) {
      imageView = (
        <CometChatImageViewer
          open
          close={() => this.setState({imageView:null})}
          message={this.state.imageView}
        />
      );
    }
    let messageComposer = (
      <CometChatMessageComposer
        ref={(el) => {
          this.composerRef = el;
        }}
        theme={this.theme}
        item={
          params.type === CometChat.RECEIVER_TYPE.USER
            ? this.state.user
            : this.state.item
        }
        type={params.type}
        // widgetsettings={route.params.widgetsettings}
        loggedInUser={this.loggedInUser}
        messageToBeEdited={this.state.messageToBeEdited}
        replyPreview={this.state.replyPreview}
        reaction={this.reactionName}
        messageToReact={this.state.messageToReact}
        actionGenerated={this.actionHandler}
        getConversationId={this.getConversationId}
        showMessage={(type, message) => {
          this.DropDownAlertRef?.showMessage(type, message);
        }}
        aoutowrite={this.state.aoutowrite}
        explod={this.state.explod}
        anket={this.state.anket}
        selectedtextmessage={this.state.selectedtextmessage}
        selectShareRight={this.selectShareRight}
        selectShareLeft={this.selectShareLeft}
        threadMessageView={this.state.threadMessageView}
        leftsendtextMessage={this.state.leftsendtextMessage}
      />
    );

    if (
      (params.type === CometChat.RECEIVER_TYPE.USER &&
        this.state.restrictions?.isOneOnOneChatEnabled === false) ||
      (params.type === CometChat.RECEIVER_TYPE.GROUP &&
        this.state.restrictions?.isGroupChatEnabled === false)
    ) {
      messageComposer = null;
    }

    let liveReactionView = null;
    if (this.state.liveReaction) {
      liveReactionView = (
        
        <View style={style.reactionsWrapperStyle}>
          <CometChatLiveReactions
            reactionName={this.reactionName}
            theme={this.theme}
            type={params.type}
            item={
              params.type === CometChat.RECEIVER_TYPE.USER
                ? this.state.user
                : this.state.item
            }
          />
        </View>
      );
    }


///// BURAD ÇALIŞma  VAR
    // let aoutosearch =(
    //   <View style={style.reactionsWrapperStyle}>
        
    //   </View>
    // );

///// BURAD ÇALIŞma  VAR SONU
 
    const threadMessageView = (
      <Modal
        transparent
        animated
        animationType="fade"
        visible={this.state.threadMessageView}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <BottomSheet
            ref={this.sheetRef}
            snapPoints={[Dimensions.get('window').height - 80, 0]}
            borderRadius={30}
            initialSnap={0}
            enabledInnerScrolling={true}
            enabledContentTapInteraction={false}
            overdragResistanceFactor={10}
            renderContent={() => {
              return (
                <View
                  style={{
                    backgroundColor: 'white',
                    height: Dimensions.get('window').height - 80,
                  }}>
                  <CometChatMessageThread
                    theme={this.theme}
                    tab={this.state.tab}
                    item={this.state.threadMessageItem}
                    type={this.state.threadMessageType}
                    parentMessage={this.state.threadMessageParent}
                    loggedInUser={this.loggedInUser}
                    actionGenerated={this.actionHandler}
                    getConversationId={this.getConversationId}
                    threadMessageView={this.state.threadMessageView}

              />
                </View>
              );
            }}
            onCloseEnd={() => {
              this.actionHandler('closeThreadClicked');
            }}
          />
        </View>
      </Modal>
    );

    return (
      // <NavigationContainer>

      <CometChatContextProvider ref={(el) => (this.contextProviderRef = el)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <SafeAreaView style={[style.chatWrapperStyle,{backgroundColor:"#558B2F"}]}>
                  {imageView}
            {this.state.showProfile ? (
              <CometChatUserProfile
                open
                close={() => this.setState({ showProfile: null })}
                url={this.state.user?.link}
              />
            ) : null}
            {this.state.videoMessage ? (
              <CometChatVideoViewer
                open
                close={() => this.setState({ videoMessage: null })}
                message={this.state.videoMessage}
              />
            ) : null}
            {this.state.userDetailVisible ? (
              <CometChatUserDetails
                open={this.state.userDetailVisible}
                theme={this.theme}
                item={
                  params.type === CometChat.RECEIVER_TYPE.USER
                    ? this.state.user
                    : this.state.item
                }
                type={params.type}
                actionGenerated={this.actionHandler}
              />
            ) : null}
            {threadMessageView}
            {this.state.groupDetailVisible ? (
              <CometChatGroupDetails
                theme={this.theme}
                open={this.state.groupDetailVisible}
                item={this.state.item}
                type={params.type}
                actionGenerated={this.actionHandler}
                loggedInUser={this.loggedInUser}
              />
            ) : null}
            <CometChatMessageActions
              item={
                params.type === CometChat.RECEIVER_TYPE.USER
                  ? this.state.user
                  : this.state.item
              }
              type={params.type}
              loggedInUser={this.loggedInUser}
              open={!!this.state.messageToReact}
              message={this.state.messageToReact}
              actionGenerated={this.actionHandler}
              close={() => {
                this.actionHandler('closeMessageActions');
              }}
            />
            <CometChatMessageHeader
              sidebar={params.sidebar}
              theme={this.theme}
              item={
                params.type === CometChat.RECEIVER_TYPE.USER
                  ? this.state.user
                  : this.state.item
              }
              type={params.type}
              viewdetail={params.viewdetail !== false}
              audioCall={params.audioCall !== false}
              videoCall={params.videoCall !== false}
              // widgetsettings={route.params.widgetsettings}
              loggedInUser={params.loggedInUser}
              actionGenerated={this.actionHandler}
              gecicialan={this.state.gecicialan}
              paket={this.state.paket}
            />
            <CometChatMessageList
              selectedtextmessage={this.state.selectedtextmessage}
              theme={this.theme}
              pinadd={this.state.pinadd}
              messages={this.state.messageList}
              item={
                params.type === CometChat.RECEIVER_TYPE.USER
                  ? this.state.user
                  : this.state.item
              }
              type={params.type}
              scrollToBottom={this.state.scrollToBottom}
              messageConfig={params.messageconfig}
              showMessage={(type, message) => {
                this.DropDownAlertRef?.showMessage(type, message);
              }}
              // widgetsettings={route.params.widgetsettings}
              // widgetconfig={route.params.widgetconfig}
              loggedInUser={params.loggedInUser}
              actionGenerated={this.actionHandler}

            />
            {liveReactionView}
            {/* {aoutosearch} */}
            {messageComposer}
          </SafeAreaView>
          <DropDownAlert ref={(ref) => (this.DropDownAlertRef = ref)} />
        </KeyboardAvoidingView>
        {this.state.ongoingDirectCall ? (
          <>
            <CometChatOutgoingDirectCall
              open
              close={() => this.actionHandler(actions.DIRECT_CALL_ENDED)}
              theme={this.theme}
              item={this.state.item}
              type={params.type}
              lang={this.state.lang}
              callType={CometChat.CALL_TYPE.VIDEO}
              joinDirectCall={this.state.joinDirectCall}
              loggedInUser={params.loggedInUser}
              actionGenerated={this.actionHandler}
            />
          </>
        ) : null}
        {this.state.restrictions?.isCallActionMessagesEnabled ? (
            <CometChatIncomingCall
              showMessage={(type, message) => {
                this.dropDownAlertRef?.showMessage(type, message);
              }}
              theme={this.theme}
              loggedInUser={this.loggedInUser}
              actionGenerated={this.actionHandler}
              outgoingCall={this.state.outgoingCall}
            />
          ) : null}
          <CometChatOutgoingCall
            theme={this.theme}
            item={this.state.item}
            type={this.state.type}
            incomingCall={this.state.incomingCall}
            outgoingCall={this.state.outgoingCall}
            loggedInUser={this.loggedInUser}
            actionGenerated={this.actionHandler}
          />
          {this.state.restrictions?.isCallActionMessagesEnabled ? (
            <CometChatIncomingDirectCall
              theme={this.props.theme}
              lang={this.state.lang}
              actionGenerated={this.actionHandler}
            />
          ) : null}
      </CometChatContextProvider>
      // {/* </NavigationContainer> */}

    );
  }
}
const styles1 = StyleSheet.create({
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
})
export default inject('user','general','apartments','auth')(observer(CometChatMessages))
