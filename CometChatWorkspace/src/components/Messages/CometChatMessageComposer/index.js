/* eslint-disable react/no-unused-state */
/* eslint-disable react/jsx-fragments */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable react/no-did-update-set-state */
import React from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  Text,
  Image,
  Keyboard,
  Platform,
  Pressable,
  Vibration
} from 'react-native';
import * as consts from '../../../utils/consts';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDIcon from 'react-native-vector-icons/AntDesign';
import { CometChat } from '@cometchat-pro/react-native-chat';
import Sound from 'react-native-sound';
import { MentionInput } from 'react-native-controlled-mentions'
import { showMessage, hideMessage } from "react-native-flash-message";

import { observer, inject } from 'mobx-react';
import { getSnapshot } from 'mobx-state-tree';

import style from './styles';

import {
  CometChatCreatePoll,
  CometChatSmartReplyPreview,
} from '../Extensions';
import CometChatStickerKeyboard from '../CometChatStickerKeyboard';
import ComposerActions from './composerActions';

import { outgoingMessageAlert } from '../../../resources/audio';
import * as enums from '../../../utils/enums';
import * as actions from '../../../utils/actions';
import { heightRatio } from '../../../utils/consts';
import { logger } from '../../../utils/common';
import { CometChatContext } from '../../../utils/CometChatContext';
import General from '../../../../../../store/general';
import RequestSuggestions from '../../../../../../Components/RequestSuggestionsChat';
import Explodingmessage from '../../../../../../Components/explodingmessage';
import constants from '../../../../../../Util/Constants'
import assets from '../../../../../../assets'
 class CometChatMessageComposer extends React.PureComponent {
  static contextType = CometChatContext;
  constructor(props) {
    super(props);

    this.imageUploaderRef = React.createRef();
    this.fileUploaderRef = React.createRef();
    this.audioUploaderRef = React.createRef();
    this.videoUploaderRef = React.createRef();
    this.messageInputRef = React.createRef();

    this.node = React.createRef();
    this.isTyping = false;

    this.state = {
      anket:false,
      ExplodingmessageText:["10 dk","30 dk","1 s","6 s","12 s","1 gün","10 gün","30 gün","100 gün"],
      dataTitle:[],
      newdatalist:[],
      newdatalistG:false,
      suggestions:[],
      vallength:0,
      newdataBeflist:[],
      aoutowrite:true,
      selectzaman:"1 gün",
      showFilePicker: false,
      messageInput: '',
      messageType: '',
      emojiViewer: false,
      createPoll: false,
      messageToBeEdited: '',
      replyPreview: null,
      stickerViewer: false,
      composerActionsVisible: false,
      user: null,
      keyboardActivity: false,
      restrictions: null,
    };
    Sound.setCategory('Ambient', true);
    this.audio = new Sound(outgoingMessageAlert);
    CometChat.getLoggedinUser()
      .then((user) => (this.loggedInUser = user))
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.props?.showMessage('error', errorCode);
      });
  }

  componentDidMount() {
    this.keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      this._keyboardDidShow,
    );
    this.keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      this._keyboardDidHide,
    );
    this.checkRestrictions();

  ////////////// . SİLLL
  // const { general} = this.props;

  //  general.getdataGenerals().then(
  //   (generaldata)=>{
  //    console.log('9696 generLDt',generaldata);
  //   })

 ////////////////// . SİLL


    this.getgeneral()
  }
  getgeneral=()=>{
    console.log('10022');
    const { general} = this.props;
    let generaldetail = getSnapshot(general);
    const dataTitle=generaldetail.generalsList[0].General?.rules5
    console.log('9787',generaldetail.generalsList[0].General)
    console.log('9788',dataTitle)
    // let newwdataTitle =dataTitle.concat(ackdet)
    this.setState({newdatalist:dataTitle,dataTitle})
  };

  checkRestrictions = async () => {
    let isLiveReactionsEnabled =
      await this.context.FeatureRestriction.isLiveReactionsEnabled();
    let isTypingIndicatorsEnabled =
      await this.context.FeatureRestriction.isTypingIndicatorsEnabled();
    let isSmartRepliesEnabled =
      await this.context.FeatureRestriction.isSmartRepliesEnabled();
    this.setState({
      restrictions: {
        isLiveReactionsEnabled,
        isTypingIndicatorsEnabled,
        isSmartRepliesEnabled,
      },
    });
  };

  componentWillUnmount() {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  _keyboardDidShow = () => {
    this.setState({ keyboardActivity: true });
  };

  _keyboardDidHide = () => {
    this.setState({ keyboardActivity: false });
  };

  componentDidUpdate(prevProps) {
    try {
      if (prevProps.messageToBeEdited !== this.props.messageToBeEdited) {
        const { messageToBeEdited } = this.props;
        this.setState({
          messageInput: messageToBeEdited.text,
          messageToBeEdited,
        });

        const element = this.messageInputRef.current;
        if (messageToBeEdited) {
          element.focus();
        } else {
          this.setState({
            messageInput: '',
          });
        }
      }

      if (prevProps.replyPreview !== this.props.replyPreview) {
        this.setState({ replyPreview: this.props.replyPreview });
      }

      if (prevProps.item !== this.props.item) {
        this.setState({ stickerViewer: false });
      }

      if (prevProps.leftsendtextMessage !== this.props.leftsendtextMessage) {
       this.sendTextMessageLEFT() 
      }

      if (prevProps.anket !== this.props.anket) {
        console.log('18777',this.props.anket);

        this.toggleCreatePoll();
        // if (this.props.type === enums.TYPE_USER) {
        //   this.props.actionGenerated(actions.POLL_CREATED, [message]);
        // }
        // if(this.state.anket){
        //   this.setState({ anket: false })
        // }else{
        //   this.setState({ anket: true });
        // }
       
      }

    } catch (error) {
      logger(error);
    }
  }

  /**
   * Handler for audio when message is sent
   * @param
   */
  playAudio = () => {
    this.audio.setCurrentTime(0);
    this.audio.play(()=>{});
  };

  /**
   * Handler for change in TextInput(messageComposer)
   * @param text: TextInput's value
   */

  changeHandler = (text) => {
    console.log('22222d');
    // this.renderSuggestions(text)

    this.startTyping();
    this.setState({ messageInput: text, messageType: 'text' });
    // let suggestions = this.getSuggestions(text);
    // this.setState({suggestions});
     this.state.aoutowrite? this.descDataGet(text):null

  };


////// BURADA ÇALIŞMA VAR
descDataGet=(texx)=>{
  var newData=[]
  var bslk=texx.slice(texx.length-1,texx.length) //son harfi al
  
  if(bslk==" ") // boşluk ise listeyi doldur
  { 
      this.setState({newdatalistG:false,newdatalist:this.state.dataTitle})
  }
  else 
  { 
      this.setState({newdatalistG:true}) //listeyi göster
      var bslk1=texx.slice(texx.length-2,texx.length-1) // sondan ikinci harfi al
      // console.log('23333 bslk1 -',bslk1,"23344",bslk1==" ")
      var dataN=  bslk1==" "?this.state.dataTitle:this.state.newdatalist //sondan ikinci boşluk ise doldur
      // console.log('253 azala azala gitmesi lazım-',dataN);
      var trimF=texx.trim() // boşlıukları al 
      var sncnewarray =trimF.split(" ")

       newData=dataN
 
      if(this.state.vallength>texx.length){
        console.log('GERİ GİTTİ GİRMESİ LAZIM');
        newData=this.state.newdataBeflist
      }
      this.setState({newdataBeflist:dataN,vallength:texx.length})
      console.log('282 vallength',this.state.vallength);
      console.log('283 dataN',dataN.length);
      console.log('284 texx ',texx.length,);
      console.log('285 sncnewarray',sncnewarray);
      console.log('286 sncnewarray son',sncnewarray[sncnewarray.length-1]);
      if(texx.length&&dataN.length&&sncnewarray[sncnewarray.length-1].length>1){
                newData=[]
                var z=0
                var sayi=-1
                var itemData=""
                var textData="" 
                for(z=0;z<dataN.length;z++){
                  // itemData = dataN[z].toUpperCase();
                  itemData = dataN[z].toLocaleUpperCase('tr-TR');
                  console.log('254 itemData',itemData);
                  // textData = texx.toUpperCase();
                  textData = sncnewarray[sncnewarray.length-1].toLocaleUpperCase('tr-TR');
                  console.log('253 textData',textData);
                  sayi= itemData.indexOf(textData)
                  console.log('22233',sayi);
                      if(sayi>-1){ 
                      newData.push(dataN[z])
                      if(newData.length==7){z=dataN.length}
                      }
                }
      }else{
        this.setState({newdatalistG:false})
      }
      // console.log('22225',newdatalist.length)
      // console.log('22226',newdatalistG);
      this.setState({newdatalist:newData})
   }
}

selectTitle=(textt)=>{
  console.log('4556',textt);
  var str = this.state.messageInput
  var arraystr=str.split(" ")
  var a=0
  var arrasatir=""
  for(a=0;a<arraystr.length;a++){
   if(arraystr[a]!==""){
    arrasatir=arrasatir+" "+arraystr[a]
   }
 }
 arrasatir=arrasatir.trim()
 
  var arraystr1=arrasatir.split(" ")
  console.log('483 str hali', arrasatir);  
  console.log('485 boşuktabn arınmıs', arraystr1);  
  console.log('490',(arraystr1[arraystr1.length-1]));
  var sonkelime= (arraystr1[arraystr1.length-1])
  var son2kelime= (arraystr1[arraystr1.length-2]+" "+sonkelime)
  var son3kelime= (arraystr1[arraystr1.length-3]+" "+son2kelime)
  var endnewstr=""

 if(arraystr1.length==1 &&textt.toLocaleUpperCase('tr-TR').indexOf(sonkelime.toLocaleUpperCase('tr-TR')) >-1){
   console.log('496',sonkelime.length+1);
     endnewstr="" 
 }    
 if(arraystr1.length>1 &&textt.toLocaleUpperCase('tr-TR').indexOf(sonkelime.toLocaleUpperCase('tr-TR')) >-1){
 console.log('496',sonkelime.length+1);
   endnewstr=arrasatir.slice(0,arrasatir.length-(sonkelime.length+1))
   console.log('497',endnewstr);
 } 
 if( arraystr1.length>2 &&textt.toLocaleUpperCase('tr-TR').indexOf( son2kelime.toLocaleUpperCase('tr-TR') ) >-1){
 console.log('496',son2kelime.length+1);
   endnewstr=arrasatir.slice(0,arrasatir.length-(son2kelime.length+1))
   console.log('497',endnewstr);
 } 
 if(arraystr1.length>3 && textt.toLocaleUpperCase('tr-TR').indexOf( son3kelime.toLocaleUpperCase('tr-TR') ) >-1){
 console.log('496',son3kelime.length+1);
   endnewstr=arrasatir.slice(0,arrasatir.length-(son3kelime.length+1))
   console.log('497',endnewstr);
 }
 
 var ssstr=str.slice(str.length-1,str.length)
 var newnewtext=""
 console.log('481',ssstr);
 if(ssstr==","||ssstr=="."||endnewstr.length==0){
 newnewtext=this.capitalizeFirstLetter(textt)+" "
 }else{
 newnewtext=this.capitalizeFirstLetterlovwercase(textt)+" "
 }
 
 var araval=endnewstr.length==0?newnewtext :endnewstr+" "+newnewtext
 console.log('514',araval);
 

 this.setState({messageInput:araval,
  newdatalist:[]
  //  inputFocused:false,
   })
   
  //  this.messageInputRef.focus()
 }
 explodF=(textt)=>{
  console.log('336',textt);
  this.setState({selectzaman:textt})
 }

capitalizeFirstLetter(str) {
  return str.charAt(0).toLocaleUpperCase('tr-TR') + str.slice(1);
}
 capitalizeFirstLetterlovwercase(str) {
return str.charAt(0).toLocaleLowerCase() + str.slice(1);
}

////// BURADA ÇALIŞMA VAR
/**
   * Fetches the receiver's details.
   * @param
   */

  getReceiverDetails = () => {
    let receiverId;
    let receiverType;

    if (this.props.type === CometChat.RECEIVER_TYPE.USER) {
      receiverId = this.props.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;
    } else if (this.props.type === CometChat.RECEIVER_TYPE.GROUP) {
      receiverId = this.props.item.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }

    return { receiverId, receiverType };
  };

  /**
   * handler for sending and generating media message
   * @param messageInput: object messageInput
   * @param messageType: object messageType
   */

  sendMediaMessage = (messageInput, messageType) => {
    try {

      const { receiverId, receiverType } = this.getReceiverDetails();
      const conversationId = this.props.getConversationId();
      const mediaMessage = new CometChat.MediaMessage(
        receiverId,
        messageInput,
        messageType,
        receiverType,
      );
      if (this.props.parentMessageId) {
        mediaMessage.setParentMessageId(this.props.parentMessageId);
      }

      this.endTyping();
      // mediaMessage.setSender(this.loggedInUser);
      mediaMessage.setReceiver(receiverType);
      mediaMessage.setConversationId(conversationId);
      mediaMessage.setType(messageType);
      mediaMessage._composedAt = Date.now();
      mediaMessage._id = '_' + Math.random().toString(36).substr(2, 9);
      mediaMessage.setId(mediaMessage._id)
      mediaMessage.setData({
        type: messageType,
        category: CometChat.CATEGORY_MESSAGE,
        name: messageInput['name'],
        file: messageInput,
        url: messageInput['uri'],
        sender: this.loggedInUser,
      });
      this.props.actionGenerated(actions.MESSAGE_COMPOSED, [mediaMessage]);
      CometChat.sendMessage(mediaMessage)
        .then(async (response) => {
          this.playAudio();

          const newMessageObj = {
            ...response,
            _id: mediaMessage._id,
            localFile: messageInput,
          };
          this.props.actionGenerated(actions.MESSAGE_SENT, newMessageObj);
        })
        .catch((error) => {
          const newMessageObj = { ...mediaMessage, error: error };
          const errorCode = error?.message || 'ERROR';
          this.props.actionGenerated(
            actions.ERROR_IN_SEND_MESSAGE,
            newMessageObj,
          );

          this.props?.showMessage('error', errorCode);
          logger('Message sending failed with error: ', error);
        });
    } catch (error) {
      logger(error);
    }
  };
/////7
showmessageDisappearing =()=>{
  showMessage({
    message: "KAYBOLAN MESAJ", 
  description: "Kaybolan mesajınız gönderildi.", 
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
showmessageeLeftSend =()=>{
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

/////
disappearingmessages(zamanT){
  function convertToMilliseconds(timeStr) {
    // var zaman=new Date().getTime()+24*60*60*1000

    const [value, unit] = timeStr.split(' ');
    switch (unit) {
      case 'dk':
        return value * 60 * 1000; // dakika -> milisaniye
      case 's':
        return value * 60 * 60 * 1000; // saat -> milisaniye
      case 'gün':
        return value * 24 * 60 * 60 * 1000; // gün -> milisaniye
      default:
        throw new Error('Geçersiz zaman birimi');
    }
  }

  const now = new Date().getTime();
  const add = convertToMilliseconds(zamanT);
  console.log('474',add);
  var zamane=now + add
  // Şimdiki zaman damgasına dönüştürülen zamanı ekler ve sonucu döndürür
  return zamane
}
////
// leftsendtextMessage
sendTextMessageLEFT = () => {
  try {
//     if (this.state.emojiViewer) {
//       this.setState({ emojiViewer: false });
//     }

//     if (!this.state.messageInput.trim().length) {
//       return false;
//     }

//     if (this.state.messageToBeEdited) {
//       this.editMessage();
//       return false;
//     }
//     this.endTyping();

//     const { receiverId, receiverType } = this.getReceiverDetails();
//     const messageInput = this.state.messageInput.trim();
//     const conversationId = this.props.getConversationId();
//     const textMessage = new CometChat.TextMessage(
//       receiverId,
//       messageInput,
//       receiverType,
//     );
//     if (this.props.parentMessageId) {
//       textMessage.setParentMessageId(this.props.parentMessageId);
//     }
// console.log('5330',this.loggedInUser,receiverId,receiverType);
//     textMessage.setSender(this.loggedInUser);
//     textMessage.setReceiver(receiverType);
//     textMessage.setText(messageInput);
//     textMessage.setConversationId(conversationId);
//     textMessage._composedAt = Date.now();
//     textMessage._id = '_' + Math.random().toString(36).substr(2, 9);
//     textMessage.setId(textMessage._id)
//     this.props.actionGenerated(actions.MESSAGE_COMPOSED, [textMessage]);

     let textMessage=this.props.leftsendtextMessage
    this.setState({ messageInput: '', replyPreview: false });

this.setState({
vallength:0,
newdataBeflist:[],
newdatalist:this.state.dataTitle,
})


    this.messageInputRef.current.textContent = '';
    this.playAudio();
    console.log('550',textMessage);
    CometChat.sendMessage(textMessage)
      .then((message) => {
        console.log('4800',message);
        this.showmessageeLeftSend()
        ////// BURADA ÇALIŞMA VAR
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
        const newMessageObj = { ...message, _id: textMessage._id };
        this.setState({ messageInput: '' });
        this.messageInputRef.current.textContent = '';
        // this.playAudio();
        this.props.actionGenerated(actions.MESSAGE_SENT, newMessageObj);
      })
      .catch((error) => {
        const newMessageObj = { ...textMessage, error: error };
        this.props.actionGenerated(
          actions.ERROR_IN_SEND_MESSAGE,
          newMessageObj,
        );
        logger('Message sending failed with error:', error);
        const errorCode = error?.message || 'ERROR';
        this.props?.showMessage('error', errorCode);
      });
  } catch (error) {
    logger(error);
  }
};
  /**
   * handler for sending Text Message
   * @param
   */

  sendTextMessage = () => {
    try {
      if (this.state.emojiViewer) {
        this.setState({ emojiViewer: false });
      }

      if (!this.state.messageInput.trim().length) {
        return false;
      }

      if (this.state.messageToBeEdited) {
        this.editMessage();
        return false;
      }
      this.endTyping();

      const { receiverId, receiverType } = this.getReceiverDetails();
      const messageInput = this.state.messageInput.trim();
      const conversationId = this.props.getConversationId();
      const textMessage = new CometChat.TextMessage(
        receiverId,
        messageInput,
        receiverType,
      );
      if (this.props.parentMessageId) {
        textMessage.setParentMessageId(this.props.parentMessageId);
      }
console.log('5330',this.loggedInUser,receiverId,receiverType);
      textMessage.setSender(this.loggedInUser);
      textMessage.setReceiver(receiverType);
      textMessage.setText(messageInput);
      textMessage.setConversationId(conversationId);
      textMessage._composedAt = Date.now();
      textMessage._id = '_' + Math.random().toString(36).substr(2, 9);
      textMessage.setId(textMessage._id)
      this.props.actionGenerated(actions.MESSAGE_COMPOSED, [textMessage]);
      this.setState({ messageInput: '', replyPreview: false });

this.setState({
vallength:0,
newdataBeflist:[],
newdatalist:this.state.dataTitle,
})


      this.messageInputRef.current.textContent = '';
      this.playAudio();
      console.log('550',textMessage);
      CometChat.sendMessage(textMessage)
        .then((message) => {
          console.log('4800',message);

          ////// BURADA ÇALIŞMA VAR
       if(  this.props.explod){
      var zamman=  this.disappearingmessages(this.state.selectzaman)
        console.log('536',zamman);
        CometChat.callExtension('disappearing-messages','DELETE','v1/disappear',{
          msgId: message.id, // The id of the message that was just sent
          timeInMS: zamman // Time in milliseconds. Should be a time from the future.
        }).then(response => {
          console.log('541',response);
          this.showmessageDisappearing()

          // Successfully scheduled for deletion
        })
       }
          

          ///////
          const newMessageObj = { ...message, _id: textMessage._id };
          this.setState({ messageInput: '' });
          this.messageInputRef.current.textContent = '';
          // this.playAudio();
          this.props.actionGenerated(actions.MESSAGE_SENT, newMessageObj);
        })
        .catch((error) => {
          const newMessageObj = { ...textMessage, error: error };
          this.props.actionGenerated(
            actions.ERROR_IN_SEND_MESSAGE,
            newMessageObj,
          );
          logger('Message sending failed with error:', error);
          const errorCode = error?.message || 'ERROR';
          this.props?.showMessage('error', errorCode);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handler for edit message
   * @param
   */

  editMessage = () => {
    try {
      const { messageToBeEdited } = this.props;

      const { receiverId, receiverType } = this.getReceiverDetails();

      const messageText = this.state.messageInput.trim();
      const textMessage = new CometChat.TextMessage(
        receiverId,
        messageText,
        receiverType,
      );
      textMessage.setId(messageToBeEdited.id);

      this.endTyping();

      CometChat.editMessage(textMessage)
        .then((message) => {
          this.setState({ messageInput: '' });
          this.messageInputRef.current.textContent = '';
          this.playAudio();

          this.closeEditPreview();
          this.props.actionGenerated(actions.MESSAGE_EDITED, message);
        })
        .catch((error) => {
          const errorCode = error?.message || 'ERROR';
          this.props?.showMessage('error', errorCode);
          logger('Message editing failed with error:', error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handler for action -> CLEAR_EDIT_PREVIEW
   * @param
   */
  closeEditPreview = () => {
    this.props.actionGenerated(actions.CLEAR_EDIT_PREVIEW);
  };

  /**
   * Handler For Generating typing Notification
   * @param timer: typingInterval
   * @param metadata: metadata object
   */

  startTyping = (timer, metadata) => {
    try {
      const typingInterval = timer || 5000;
      if (!this.state.restrictions?.isTypingIndicatorsEnabled) {
        return false;
      }
      if (this.isTyping) {
        return false;
      }

      const { receiverId, receiverType } = this.getReceiverDetails();
      const typingMetadata = metadata || undefined;

      const typingNotification = new CometChat.TypingIndicator(
        receiverId,
        receiverType,
        typingMetadata,
      );
      CometChat.startTyping(typingNotification);

      this.isTyping = setTimeout(() => {
        this.endTyping();
      }, typingInterval);
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handler to end typing Notification
   * @param metadata: metadata object
   */

  endTyping = (metadata) => {
    try {
      // this.setState({newdatalist:[]})
      const { receiverId, receiverType } = this.getReceiverDetails();

      const typingMetadata = metadata || undefined;

      const typingNotification = new CometChat.TypingIndicator(
        receiverId,
        receiverType,
        typingMetadata,
      );
      CometChat.endTyping(typingNotification);

      clearTimeout(this.isTyping);
      this.isTyping = null;
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handler to toggle Sticker Picker screen
   * @param
   */

  toggleStickerPicker = () => {
    const { stickerViewer } = this.state;
    this.setState({
      composerActionsVisible: false,
      stickerViewer: !stickerViewer,
    });
  };

  /**
   * handler to toggle create poll screen
   * @param
   */
  toggleCreatePoll = () => {
    const { createPoll,anket } = this.state;
    this.setState({ composerActionsVisible: false, createPoll: !createPoll,anket:false });
  
}

  /**
   * handler to close create poll screen
   * @param
   */
  closeCreatePoll = () => {
    this.toggleCreatePoll();
  };

  /**
   * handler for various action
   * @param action: action name
   * @param message: message object
   */
  actionHandler = (action, message) => {
    switch (action) {
      case actions.POLL_CREATED:
        this.toggleCreatePoll();
        if (this.props.type === enums.TYPE_USER) {
          this.props.actionGenerated(actions.POLL_CREATED, [message]);
        }
        // temporary check; custom data listener working for sender too\

        break;
      case actions.SEND_STICKER:
        this.sendSticker(message);
        break;
//////////////// BURADA ÇALIŞMA
        // case actions.AOUTO_WRİTE:
        //   this.aoutowrite()
        //   // this.viewmessagepin(messages);
        //   break;


//////////////// BURADA ÇALIŞMA sonu
      case actions.CLOSE_STICKER:
        this.toggleStickerPicker();
        break;
      default:
        break;
    }
  };
////
// aoutowrite=()=>{
//   console.log('6599',);

//   var resaoutowrite=this.state.aoutowrite?false:true
//   this.setState({ aoutowrite: resaoutowrite });
 
// }

  /**
   * handler for sending sticker message
   * @param stickerMessage: object stickerMessage
   */
  sendSticker = (stickerMessage) => {

    const { receiverId, receiverType } = this.getReceiverDetails();

    const customData = {
      sticker_url: stickerMessage.stickerUrl,
      sticker_name: stickerMessage.stickerName,
    };
    const customType = enums.CUSTOM_TYPE_STICKER;
    const conversationId = this.props.getConversationId();
    const customMessage = new CometChat.CustomMessage(
      receiverId,
      receiverType,
      customType,
      customData,
    );
    if (this.props.parentMessageId) {
      customMessage.setParentMessageId(this.props.parentMessageId);
    }
    customMessage.setConversationId(conversationId);
    customMessage.setSender(this.loggedInUser);
    customMessage.setReceiver(receiverType);
    customMessage.setConversationId(conversationId);
    customMessage._composedAt = Date.now();
    customMessage._id = '_' + Math.random().toString(36).substr(2, 9);
    this.props.actionGenerated(actions.MESSAGE_COMPOSED, [customMessage]);
    CometChat.sendCustomMessage(customMessage)
      .then((message) => {
        this.playAudio();
        const newMessageObj = { ...message, _id: customMessage._id };

        this.props.actionGenerated(actions.MESSAGE_SENT, newMessageObj);
      })
      .catch((error) => {
        const newMessageObj = { ...customMessage, error: error };
        this.props.actionGenerated(
          actions.ERROR_IN_SEND_MESSAGE,
          newMessageObj,
        );
        const errorCode = error?.message || 'ERROR';

        this.props?.showMessage('error', errorCode);
        logger('custom message sending failed with error', error);
      });
  };

  /**
   * handler for sending reply message
   * @param messageInput: object messageInput
   */

  sendReplyMessage = (messageInput) => {

    try {
      const { receiverId, receiverType } = this.getReceiverDetails();
      const textMessage = new CometChat.TextMessage(
        receiverId,
        messageInput,
        receiverType,
      );
      if (this.props.parentMessageId) {
        textMessage.setParentMessageId(this.props.parentMessageId);
      }

      CometChat.sendMessage(textMessage)
        .then((message) => {
          this.playAudio();
          this.setState({ replyPreview: null });
          this.props.actionGenerated(actions.MESSAGE_COMPOSED, [message]);
        })
        .catch((error) => {
          const errorCode = error?.message || 'ERROR';
          this.props?.showMessage('error', errorCode);
          logger('Message sending failed with error:', error);
        });
    } catch (error) {
      logger(error);
    }
  };

  clearReplyPreview = () => {
    this.setState({ replyPreview: null });
  };

  /**
   * handler for sending reactions
   * @param
   */
  sendReaction = (event) => {
    const typingInterval = 1000;
    try {
      const metadata = {
        type: enums.METADATA_TYPE_LIVEREACTION,
        reaction: this.props.reactionName || 'heart',
      };

      const { receiverId, receiverType } = this.getReceiverDetails();
      let transientMessage = new CometChat.TransientMessage(
        receiverId,
        receiverType,
        metadata,
      );
      CometChat.sendTransientMessage(transientMessage);
    } catch (err) {
      logger(err);
    }
    this.props.actionGenerated(actions.SEND_REACTION);
    event.persist();
    setTimeout(() => {
      this.props.actionGenerated(actions.STOP_REACTION);
    }, typingInterval);
  };
///////////
descDataGet=(texx)=>{
  var newData=[]
  var bslk=texx.slice(texx.length-1,texx.length) //son harfi al
  console.log('703',this.state.dataTitle);
  if(bslk==" ") // boşluk ise listeyi doldur
  { this.setState({newdatalistG:false,newdatalist:this.state.dataTitle})

  }else { //
      this.setState({newdatalistG:true}) //listeyi göster
      var bslk1=texx.slice(texx.length-2,texx.length-1) // sondan ikinci harfi al
       console.log('23333 bslk1 -',bslk1,"23344",bslk1==" ")
       console.log('7111',this.state.dataTitle , this.state.newdatalist);
      var dataN=  bslk1==" "?this.state.dataTitle:this.state.newdatalist //sondan ikinci boşluk ise doldur
      // console.log('253 azala azala gitmesi lazım-',dataN);
      var trimF=texx.trim() // boşlıukları al 
                      var sncnewarray =trimF.split(" ")
console.log('715',dataN);
                      
  newData=dataN
 
   if(this.state.vallength>texx.length){
    console.log('GERİ GİTTİ GİRMESİ LAZIM');
    newData=this.state.newdataBeflist
   }
   this.setState({newdataBeflist:dataN,vallength:texx.length})
   console.log('282 vallength',this.state.vallength);
   console.log('283 dataN',dataN.length);
   console.log('284 texx ',texx.length,);
   console.log('285 sncnewarray',sncnewarray);
   console.log('286 sncnewarray son',sncnewarray[sncnewarray.length-1]);
      if(texx.length&&dataN.length&&sncnewarray[sncnewarray.length-1].length>1){
                newData=[]
                var z=0
                var sayi=-1
                var itemData=""
                var textData="" 
                for(z=0;z<dataN.length;z++){
                  // itemData = dataN[z].toUpperCase();
                  itemData = dataN[z].toLocaleUpperCase('tr-TR');
                  console.log('254 itemData',itemData);
                  // textData = texx.toUpperCase();
                  textData = sncnewarray[sncnewarray.length-1].toLocaleUpperCase('tr-TR');
                  console.log('253 textData',textData);
                  sayi= itemData.indexOf(textData)
                  console.log('22233',sayi);
                      if(sayi>-1){ 
                      newData.push(dataN[z])
                      if(newData.length==7){z=dataN.length}
                      }
                }
      }else{
        this.setState({newdatalistG:false})
      }
   
      this.setState({newdatalist:newData})
   }
  // return newData
}
// selectshareothers=()=>{

// }
// selectshareavailable=()=>{
//   this.props.navigation.navigate(
//     UsersComponent
//     // {
//     //   type,
//     //   item: { ...item },
//     //   theme: this.theme,
//     //   tab: this.state.tab,
//     //   loggedInUser: this.loggedInUser,
//     //   callMessage: this.state.callMessage,
//     //   actionGenerated: this.actionHandler,
//     //   composedThreadMessage: this.state.composedThreadMessage,
//     // },
//   );
// }  
///////////
  render() {
    console.log('22562',this.props.selectedtextmessage);
    //  if(this.props.aoutowrite&&this.state.createPoll){this.toggleCreatePoll(1)}{this.toggleCreatePoll(2)}
    let disabled = false;
    if (this.props.item.blockedByMe) {
      disabled = true;
    }

    let liveReactionBtn = null;
    if (
      Object.prototype.hasOwnProperty.call(
        enums.LIVE_REACTIONS,
        this.props.reaction,
      )
    ) {
      const reactionName = this.props.reaction;
      liveReactionBtn = (
        <TouchableOpacity
          style={style.reactionBtnStyle}
          disabled={disabled}
          onPress={this.sendReaction}>
          <Icon name={`${reactionName}`} size={30} color="#de3a39" />
        </TouchableOpacity>
      );
    }
///////
let sharebutton =  
<View style={{flexDirection:"row"}}>
 <TouchableOpacity
style={style.sendButtonStyle}
onPress={() => this.props.selectShareLeft(this.props.selectedtextmessage)}>
  <Image
            source={assets.shareleft}
            resizeMode="contain"
            style={{width:22,height:22}}
          />
      {/* <Icon name="share" size={30} color="#3299ff" style={{transform: [{rotate: '190deg'}]}} /> */}
</TouchableOpacity>
<TouchableOpacity
style={style.sendButtonStyle}
onPress={() => this.props.selectShareRight(this.props.selectedtextmessage)}>
 <Image
            source={assets.shareright}
            resizeMode="contain"
            style={{width:22,height:22}}
            
          /></TouchableOpacity>
</View>

/////
    let sendBtn = (
      <TouchableOpacity
        style={style.sendButtonStyle}
        onPress={() => this.sendTextMessage()}>
        <Icon name="send" size={20} color="#3299ff" />
      </TouchableOpacity>
    );

    if (
      !this.state.messageInput.length &&
      this.state.restrictions?.isLiveReactionsEnabled
    ) {
      sendBtn = null;
    } else {
      liveReactionBtn = null;
    }

    let editPreview = null;
    if (this.state.messageToBeEdited) {
      editPreview = (
        <View
          style={[
            style.editPreviewContainerStyle,
            {
              backgroundColor: `${this.props.theme.backgroundColor.white}`,
              borderColor: `${this.props.theme.borderColor.primary}`,
            },
          ]}>
          <View
            style={[
              style.previewHeadingContainer,
              {
                borderLeftColor: this.props.theme.color.secondary,
              },
            ]}>
            <View style={style.previewHeadingStyle}>
              <Text
                style={[
                  style.previewTextStyle,
                  {
                    color: `${this.props.theme.color.black}`,
                  },
                ]}>
                Mesajı düzenle
              </Text>
              <TouchableOpacity
                style={style.previewCloseStyle}
                onPress={this.closeEditPreview}>
                <Icon
                  name="close"
                  size={23}
                  color={this.props.theme.color.secondary}
                />
              </TouchableOpacity>
            </View>
            <View>
              <Text
                style={{
                  color: `${this.props.theme.color.helpText}`,
                }}>
                {this.state.messageToBeEdited.text}
              </Text>
            </View>
          </View>
        </View>
      );
    }
    let blockedPreview = null;
    if (disabled) {
      blockedPreview = (
        <View
          style={[
            style.blockedPreviewContainer,
            {
              backgroundColor: this.props.theme.backgroundColor.blue,
            },
          ]}>
          <Text
            style={[
              style.blockedPreviewText1,
              {
                color: this.props.theme.color.white,
              },
            ]}>
            Bu kullanıcıyı engellediniz
          </Text>
          <Text
            style={[
              style.blockedPreviewText2,
              {
                color: this.props.theme.color.white,
              },
            ]}>
            Sohbet başlatmak için kullanıcı bilgilerine tıklayın ve kullanıcının engellemesini kaldırın
          </Text>
        </View>
      );
    }

    let smartReplyPreview = null;
    if (this.state.replyPreview) {
      const message = this.state.replyPreview;
      if (Object.prototype.hasOwnProperty.call(message, 'metadata')) {
        const { metadata } = message;
        if (Object.prototype.hasOwnProperty.call(metadata, '@injected')) {
          const injectedObject = metadata['@injected'];
          if (
            Object.prototype.hasOwnProperty.call(injectedObject, 'extensions')
          ) {
            const extensionsObject = injectedObject.extensions;
            if (
              Object.prototype.hasOwnProperty.call(
                extensionsObject,
                'smart-reply',
              )
            ) {
              const smartReplyObject = extensionsObject['smart-reply'];

              const options = [
                smartReplyObject.reply_positive,
                smartReplyObject.reply_neutral,
                smartReplyObject.reply_negative,
              ];

              smartReplyPreview = (
                <CometChatSmartReplyPreview
                  {...this.props}
                  options={options}
                  clicked={this.sendReplyMessage}
                  close={this.clearReplyPreview}
                />
              );
            }
          }
        }
      }
    }

    if (!this.state.restrictions?.isSmartRepliesEnabled) {
      smartReplyPreview: false;
    }

    let stickerViewer = null;
    if (this.state.stickerViewer) {
      stickerViewer = (
        <CometChatStickerKeyboard
          theme={this.props.theme}
          item={this.props.item}
          type={this.props.type}
          actionGenerated={this.actionHandler}
        />
      );
    }

    const createPoll = (
      <CometChatCreatePoll
        theme={this.props.theme}
        item={this.props.item}
        type={this.props.type}
        open={this.state.createPoll}
        anket={this.state.anket}
        close={this.closeCreatePoll}
        actionGenerated={this.actionHandler}
      />
    );
  ///// BURAD ÇALIŞMAAA
  console.log('9522',this.props.threadMessageView);  
    return (
      <View
        style={
          Platform.OS === 'android' && this.state.keyboardActivity
            ? {
                marginBottom: 21 * heightRatio,
                elevation: 5,
                backgroundColor: '#fff',
              }
            : { elevation: 5, backgroundColor: '#fff' }
        }>
        {blockedPreview}
        {editPreview}
        {createPoll}
        {stickerViewer}
        {smartReplyPreview}
        {/* BURADA ÇALIŞMA VAR */}
{ this.props.aoutowrite&&this.state.messageInput.length>1 &&this.state. newdatalist.length&&this.state.newdatalistG?
  // ||(dataTitle.length !== 0 &&val.length!==0 &&! inputFocused)  (
                      <RequestSuggestions
                      data={this.state.newdatalist}
                      extraData={this.state}
                      selectTitlee={this.selectTitle}
                      style={{  position :"absolute",bottom:50,
                      flex: 0,left: 0}}
                      />
                      :null}

{/* BURADA ÇALIŞMA VAR SONU */}
{ this.props.explod? 
<Explodingmessage
data={this.state.ExplodingmessageText}
extraData={this.state}
selectTitlee={this.explodF}
selectzaman={this.state.selectzaman}
style={{  position :"absolute",bottom:55,
flex: 0,left: 0}}
/>
:null}


        <ComposerActions
          visible={this.state.composerActionsVisible}
          close={() => {
            if (this.state.composerActionsVisible == true) {
              this.setState({ composerActionsVisible: false });
            }
          }}
          toggleStickers={this.toggleStickerPicker}
          toggleCreatePoll={this.toggleCreatePoll}
          sendMediaMessage={this.sendMediaMessage}
          anket={this.props.anket}
        />
        <View style={style.mainContainer}>
          <TouchableOpacity
            style={style.plusCircleContainer}
            disabled={disabled}
            onPress={() => {
              this.setState({ composerActionsVisible: true });
            }}>
            <AntDIcon size={26} name="pluscircle" color="rgba(0,0,0,0.35)" />
          </TouchableOpacity>


          <View style={[style.textInputContainer,{}]}>




            <TextInput
              style={[style.messageInputStyle,{borderRadius:12,borderWidth:.3,borderColor:"#BDBDBD"}]}
              editable={!disabled}
              value={this.state.messageInput}
              placeholder="Mesajını Yaz..."
              onChangeText={(text) => this.changeHandler(text)}
              onBlur={this.endTyping}
              ref={this.messageInputRef}
            />

           


            
            {sendBtn}
          </View>

          {this.props.threadMessageView||this.props.selectedtextmessage?.length==0?null: sharebutton}
        </View>
      </View>
    );
  }
}
export default 
inject('general')(observer( CometChatMessageComposer))