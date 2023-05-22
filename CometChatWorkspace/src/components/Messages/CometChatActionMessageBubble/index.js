import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { CometChat } from '@cometchat-pro/react-native-chat';
import * as enums from '../../../utils/enums';
import style from './styles';

const CometChatActionMessageBubble = (props) => {
  /**
   * Retrieve message text from message object according to message types
   * @param
   */
  const getMessage = useCallback(() => {
    const call = props.message;
    const { loggedInUser } = props;

    let message = null;
    switch (call.status) {
      case CometChat.CALL_STATUS.INITIATED: {
        message = 'Arama başlatıldı';
        if (call.type === CometChat.CALL_TYPE.AUDIO) {
          if (call.receiverType === CometChat.RECEIVER_TYPE.USER) {
            message =
              call.callInitiator.uid === loggedInUser.uid
                ? 'Giden sesli arama'
                : 'Gelen sesli arama';
          } else if (call.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
            if (call.action === CometChat.CALL_STATUS.INITIATED) {
              message =
                call.callInitiator.uid === loggedInUser.uid
                  ? 'Giden sesli arama'
                  : 'Gelen sesli arama';
            } else if (call.action === CometChat.CALL_STATUS.REJECTED) {
              message =
                call.sender.uid === loggedInUser.uid
                  ? 'Arama reddedildi'
                  : `${call.sender.name} reddedilen çağrı`;
            }
          }
        } else if (call.type === CometChat.CALL_TYPE.VIDEO) {
          if (call.receiverType === CometChat.RECEIVER_TYPE.USER) {
            message =
              call.callInitiator.uid === loggedInUser.uid
                ? 'Giden görüntülü arama'
                : 'Gelen görüntülü arama';
          } else if (call.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
            if (call.action === CometChat.CALL_STATUS.INITIATED) {
              message =
                call.callInitiator.uid === loggedInUser.uid
                  ? 'Giden görüntülü arama'
                  : 'Gelen görüntülü arama';
            } else if (call.action === CometChat.CALL_STATUS.REJECTED) {
              message =
                call.sender.uid === loggedInUser.uid
                  ? 'Arama reddedildi'
                  : `${call.sender.name} reddedilen çağrı`;
            }
          }
        }
        break;
      }
      case CometChat.CALL_STATUS.ONGOING: {
        if (call.receiverType === CometChat.RECEIVER_TYPE.USER) {
          message = 'Call accepted';
        } else if (call.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
          if (call.action === CometChat.CALL_STATUS.ONGOING) {
            message =
              call.sender.uid === loggedInUser.uid
                ? 'Çağrı kabul edildi'
                : `${call.sender.name} katıldı`;
          } else if (call.action === CometChat.CALL_STATUS.REJECTED) {
            message =
              call.sender.uid === loggedInUser.uid
                ? 'Arama reddedildi'
                : `${call.sender.name} reddedilen çağrı`;
          } else if (call.action === 'left') {
            message =
              call.sender.uid === loggedInUser.uid
                ? 'aramayı bıraktın'
                : `${call.sender.name} aramadan ayrıldı`;
          }
        }

        break;
      }
      case CometChat.CALL_STATUS.UNANSWERED: {
        message = 'cevapsız çağrı';
        if (
          call.type === CometChat.CALL_TYPE.AUDIO &&
          (call.receiverType === CometChat.RECEIVER_TYPE.USER ||
            call.receiverType === CometChat.RECEIVER_TYPE.GROUP)
        ) {
          message =
            call.callInitiator.uid === loggedInUser.uid
              ? 'Cevapsız sesli arama'
              : 'Cevapsız sesli arama';
        } else if (
          call.type === CometChat.CALL_TYPE.VIDEO &&
          (call.receiverType === CometChat.RECEIVER_TYPE.USER ||
            call.receiverType === CometChat.RECEIVER_TYPE.GROUP)
        ) {
          message =
            call.callInitiator.uid === loggedInUser.uid
              ? 'Cevapsız görüntülü görüşme'
              : 'Cevapsız görüntülü görüşme';
        }
        break;
      }
      case CometChat.CALL_STATUS.REJECTED: {
        message = 'Arama reddedildi';
        break;
      }
      case CometChat.CALL_STATUS.ENDED:
        message = 'Arama sona erdi';
        break;
      case CometChat.CALL_STATUS.CANCELLED:
        message = 'Arama iptal edildi';
        break;
      case CometChat.CALL_STATUS.BUSY:
        message = 'Çağrı meşgul';
        break;
      default:
        break;
    }

    return <Text style={style.callMessageTxtStyle}>{message}</Text>;
  }, [props]);

  return <View style={style.callMessageStyle}>{getMessage()}</View>;
};

export default CometChatActionMessageBubble;
