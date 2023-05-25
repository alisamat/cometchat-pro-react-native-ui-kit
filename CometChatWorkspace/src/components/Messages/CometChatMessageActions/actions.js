import React, { useState, useContext, useEffect } from 'react';
import {
  Text,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import IonIcon from 'react-native-vector-icons/Ionicons';
import MCIIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './styles';
import * as actions from '../../../utils/actions';
import * as enums from '../../../utils/enums';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { CometChatContext } from '../../../utils/CometChatContext';

const actionIconSize = 26;

export default (props) => {
  const [restrictions, setRestrictions] = useState(null);
  const context = useContext(CometChatContext);
  useEffect(() => {
    checkRestrictions();
  }, []);

  const checkRestrictions = async () => {
    let enableEditMessage =
      await context.FeatureRestriction.isEditMessageEnabled();
    let enableThreadedChats =
      await context.FeatureRestriction.isThreadedMessagesEnabled();
    let enableDeleteMessage =
      await context.FeatureRestriction.isDeleteMessageEnabled();
    let enableDeleteMessageForModerator =
      await context.FeatureRestriction.isDeleteMemberMessageEnabled();
    let enableMessageInPrivate =
      await context.FeatureRestriction.isMessageInPrivateEnabled();

    if (
      !enableEditMessage &&
      !enableThreadedChats &&
      !enableDeleteMessage &&
      !enableDeleteMessageForModerator &&
      !enableMessageInPrivate
    ) {
      props.actionGenerated(actions.CLOSE_MESSAGE_ACTIONS);
    }
    setRestrictions({
      enableEditMessage,
      enableThreadedChats,
      enableDeleteMessage,
      enableDeleteMessageForModerator,
      enableMessageInPrivate,
    });
  };

  let sendMessage = null;
  if (
    props.message.messageFrom === enums.MESSAGE_FROM_RECEIVER &&
    props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP &&
    restrictions?.enableMessageInPrivate
  ) {
    sendMessage = (
      <TouchableOpacity
        style={styles.action}
        onPress={() =>
          props.actionGenerated(actions.SEND_MESSAGE, props.message)
        }>
        <FeatherIcon name="message-circle" size={actionIconSize} />
        <Text style={styles.actionsText}>Özel Mesaj Gönder</Text>
      </TouchableOpacity>
    );
  }
  let threadedChats = (
    <TouchableOpacity
      style={styles.action}
      onPress={() =>
        props.actionGenerated(actions.VIEW_MESSAGE_THREAD, props.message)
      }>
      <FeatherIcon name="message-circle" size={actionIconSize} />
      <Text style={styles.actionsText}>Mesaj için yeni yanıt gir</Text>
    </TouchableOpacity>
  );
  /////////// SABİTLE
   let pinT = (
    <TouchableOpacity
      style={styles.action}
      onPress={() =>
        
       // props.actionGenerated(actions.VIEW_MESSAGE_THREAD, props.message)
              CometChat.callExtension('pin-message', 'POST', 'v1/pin', {
                "msgId": props.message.id // The ID of the message to be pinned. Here 280.
                }).then(response => {
                  console.log('9992',response);
                  if(response.success){
                    props.actionGenerated(actions.VIEW_MESSAGE_PIN, props.message)

                  }
                    // { success: true }
                })
                .catch(error => {
                  console.log('9696',error);
                  console.log('9898',props.message);
                    // Error occurred
                })
      }>
      {/* <FeatherIcon name="message-circle" size={actionIconSize} /> */}
      {/* <FeatherIcon name="message-circle" size={actionIconSize} /> */}
      <IonIcon name='pin' size={26} color='green' />    

      <Text style={styles.actionsText}>Mesajı sabitle</Text>
    </TouchableOpacity>
  );

  // if threaded messages need to be disabled
  if (
    props.message.category === CometChat.CATEGORY_CUSTOM ||
    props.message.parentMessageId ||
    !restrictions?.enableThreadedChats
  ) {
    threadedChats = null;
  }

  let deleteMessage = (
    <TouchableOpacity
      style={styles.action}
      onPress={() =>
        props.actionGenerated(actions.DELETE_MESSAGE, props.message)
      }>
      <IonIcon name="ios-trash-outline" size={actionIconSize} color="red" />
      <Text style={styles.actionsText}>Mesajı Sil</Text>
    </TouchableOpacity>
  );

  // if deleting messages need to be disabled

  if (
    props.message.messageFrom === enums.MESSAGE_FROM_RECEIVER &&
    (props.type == CometChat.RECEIVER_TYPE.GROUP
      ? props.item.scope == CometChat.GROUP_MEMBER_SCOPE.MODERATOR ||
        props.item.scope == CometChat.GROUP_MEMBER_SCOPE.ADMIN
        ? !restrictions?.enableDeleteMessageForModerator
        : true
      : true)
  ) {
    deleteMessage = null;
  }
  if (
    props.type == CometChat.RECEIVER_TYPE.USER &&
    !restrictions?.enableDeleteMessage
  ) {
    deleteMessage = null;
  }
  let editMessage = (
    <TouchableOpacity
      style={styles.action}
      onPress={() =>
        props.actionGenerated(actions.EDIT_MESSAGE, props.message)
      }>
      <MCIIcon name="square-edit-outline" size={actionIconSize} />
      <Text style={styles.actionsText}>Mesajı Düzenle</Text>
    </TouchableOpacity>
  );

  // if editing messages need to be disabled
  if (
    props.message.messageFrom === enums.MESSAGE_FROM_RECEIVER ||
    props.message.type !== CometChat.MESSAGE_TYPE.TEXT ||
    !restrictions?.enableEditMessage
  ) {
    editMessage = null;
  }

  return (
    <TouchableWithoutFeedback onPress={() => {}}>
      <View style={styles.actionsContainer}>
        {sendMessage}
        {threadedChats}
        {pinT}
        {editMessage}
        {deleteMessage}
      </View>
    </TouchableWithoutFeedback>
  );
};
