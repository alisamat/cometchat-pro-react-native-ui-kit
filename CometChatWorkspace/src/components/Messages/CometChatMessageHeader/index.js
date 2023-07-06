/* eslint-disable radix */
import React from 'react';
import { MessageHeaderManager } from './controller';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { showMessage, hideMessage } from "react-native-flash-message";
import MCIIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { CometChatUserPresence, CometChatAvatar } from '../../Shared';
import * as enums from '../../../utils/enums';
import * as actions from '../../../utils/actions';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './styles';
import audioCallIcon from './resources/audioCall.png';
import videoCallIcon from './resources/videoCall.png';
import detailPaneIcon from './resources/detailpane.png';
import { logger } from '../../../utils/common';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { CometChatContext } from '../../../utils/CometChatContext';
import assets from '../../../../../../assets'
import constants from '../../../../../../Util/Constants'
const {widthRatio,height, heightRatio} = constants.styleGuide;

class CometChatMessageHeader extends React.Component {
  static contextType = CometChatContext;
  constructor(props) {
    super(props);

    this.state = {
      status: '',
      presence: 'offline',
      aoutowrite:true,
      Disappearing:false,
      anket:false,
    };
  }

  componentDidMount() {
    this.MessageHeaderManager = new MessageHeaderManager();
    this.MessageHeaderManager.attachListeners(this.updateHeader);

    if (this.props.type === CometChat.RECEIVER_TYPE.USER) {
      this.setStatusForUser();
    } else {
      this.setStatusForGroup();
    }
    this.checkRestrictions();
  }

  checkRestrictions = async () => {
    let isGroupVideoCallEnabled =
      await this.context.FeatureRestriction.isGroupVideoCallEnabled();
    let isOneOnOneAudioCallEnabled =
      await this.context.FeatureRestriction.isOneOnOneAudioCallEnabled();
    let isTypingIndicatorsEnabled =
      await this.context.FeatureRestriction.isTypingIndicatorsEnabled();
    let isOneOnOneVideoCallEnabled =
      await this.context.FeatureRestriction.isOneOnOneVideoCallEnabled();
    this.setState({
      restrictions: {
        isGroupVideoCallEnabled,
        isOneOnOneAudioCallEnabled,
        isTypingIndicatorsEnabled,
        isOneOnOneVideoCallEnabled,
      },
    });
  };

  componentDidUpdate(prevProps) {
    try {
      this.MessageHeaderManager.removeListeners();
      this.MessageHeaderManager = new MessageHeaderManager();
      this.MessageHeaderManager.attachListeners(this.updateHeader);

      if (
        this.props.type === CometChat.RECEIVER_TYPE.USER &&
        prevProps.item.uid !== this.props.item.uid
      ) {
        this.setStatusForUser();
      } else if (
        this.props.type === CometChat.RECEIVER_TYPE.GROUP &&
        (prevProps.item.guid !== this.props.item.guid ||
          (prevProps.item.guid === this.props.item.guid &&
            prevProps.item.membersCount !== this.props.item.membersCount))
      ) {
        this.setStatusForGroup();
      }
    } catch (error) {
      logger(error);
    }
  }

  componentWillUnmount() {
    this.MessageHeaderManager.removeListeners();
    this.MessageHeaderManager = null;
  }

  /**
   * handler for set status for user i.e online/offline
   * @param
   */

  setStatusForUser = () => {
    try {
      let { status } = this.props.item;
      const presence =
        this.props.item.status === CometChat.USER_STATUS.ONLINE
          ? CometChat.USER_STATUS.ONLINE
          : CometChat.USER_STATUS.OFFLINE;
      if (
        this.props.item.status === CometChat.USER_STATUS.OFFLINE &&
        this.props.item.lastActiveAt
      ) {
        let messageTimestamp = new Date(this.props.item.lastActiveAt * 1000);
        const currentTimestamp = new Date();

        if (
          messageTimestamp.getUTCFullYear() ==
            currentTimestamp.getUTCFullYear() &&
          messageTimestamp.getUTCMonth() == currentTimestamp.getUTCMonth() &&
          messageTimestamp.getUTCDate() == currentTimestamp.getUTCDate()
        ) {
          let hours = messageTimestamp.getHours();
          let minutes = messageTimestamp.getMinutes();
          let ampm = hours >= 12 ? 'pm' : 'am';
          hours = hours % 12;
          hours = hours ? hours : 12;
          minutes = minutes < 10 ? '0' + minutes : minutes;
          status = hours + ':' + minutes + ' ' + ampm.toUpperCase();
        } else if (
          messageTimestamp.getUTCFullYear() ==
            currentTimestamp.getUTCFullYear() &&
          messageTimestamp.getUTCMonth() == currentTimestamp.getUTCMonth() &&
          messageTimestamp.getUTCDate() == currentTimestamp.getUTCDate() - 1
        ) {
          let hours = messageTimestamp.getHours();
          let minutes = messageTimestamp.getMinutes();
          let ampm = hours >= 12 ? 'pm' : 'am';
          hours = hours % 12;
          hours = hours ? hours : 12;
          minutes = minutes < 10 ? '0' + minutes : minutes;
          status =
            'Yesterday, ' + hours + ':' + minutes + ' ' + ampm.toUpperCase();
        } else {
          const month = String(messageTimestamp.getMonth()+1).padStart(2, '0');
          const day = String(messageTimestamp.getDate()).padStart(2, '0');
          const year = messageTimestamp.getFullYear();
          status = day + '/' + month + '/' + year;
        }
      } else if (this.props.item.status === CometChat.USER_STATUS.OFFLINE) {
        status = 'offline';
      }

      this.setState({ status, presence });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handler for set status for group i.e memberCount
   * @param
   */
  setStatusForGroup = () => {
    try {
      const status = `${this.props.item.membersCount} üye`;
      this.setState({ status });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handler for updation of header based on key.
   * @param key: action name
   * @param item: item object
   * @param groupUser: groupUser object
   */
  updateHeader = (key, item, groupUser) => {
    try {
      switch (key) {
        case enums.USER_ONLINE:
        case enums.USER_OFFLINE: {
          if (
            this.props.type === CometChat.RECEIVER_TYPE.USER &&
            this.props.item.uid === item.uid
          ) {
            this.setState({ status: item.status, presence: item.status });
          }
          this.props.actionGenerated(actions.STATUS_UPDATED, item.status);
          break;
        }
        case enums.GROUP_MEMBER_KICKED:
        case enums.GROUP_MEMBER_BANNED:
        case enums.GROUP_MEMBER_LEFT:
          if (
            this.props.type === CometChat.RECEIVER_TYPE.GROUP &&
            this.props.item.guid === item.guid &&
            this.props.loggedInUser.uid !== groupUser.uid
          ) {
            const membersCount = parseInt(item.membersCount);
            const status = `${membersCount} üye`;
            this.setState({ status });
          }
          break;
        case enums.GROUP_MEMBER_JOINED:
          if (
            this.props.type === CometChat.RECEIVER_TYPE.GROUP &&
            this.props.item.guid === item.guid
          ) {
            const membersCount = parseInt(item.membersCount);
            const status = `${membersCount} üye`;
            this.setState({ status });
          }
          break;
        case enums.GROUP_MEMBER_ADDED:
          if (
            this.props.type === CometChat.RECEIVER_TYPE.GROUP &&
            this.props.item.guid === item.guid
          ) {
            const membersCount = parseInt(item.membersCount);
            const status = `${membersCount} üye`;
            this.setState({ status });
          }
          break;
        case enums.TYPING_STARTED: {
          if (
            this.props.type === CometChat.RECEIVER_TYPE.GROUP &&
            this.props.type === item.receiverType &&
            this.props.item.guid === item.receiverId
          ) {
            if (this.state.restrictions?.isTypingIndicatorsEnabled) {
              this.setState({ status: `${item.sender.name} yazıyor...` });
              this.props.actionGenerated(actions.SHOW_REACTION, item);
            }
          } else if (
            this.props.type === CometChat.RECEIVER_TYPE.USER &&
            this.props.type === item.receiverType &&
            this.props.item.uid === item.sender.uid
          ) {
            this.setState({ status: 'yazıyor...' });
            this.props.actionGenerated(actions.SHOW_REACTION, item);
          }
          break;
        }
        case enums.TYPING_ENDED: {
          if (
            this.props.type === CometChat.RECEIVER_TYPE.GROUP &&
            this.props.type === item.receiverType &&
            this.props.item.guid === item.receiverId
          ) {
            this.setStatusForGroup();
            this.props.actionGenerated(actions.STOP_REACTION, item);
          } else if (
            this.props.type === CometChat.RECEIVER_TYPE.USER &&
            this.props.type === item.receiverType &&
            this.props.item.uid === item.sender.uid
          ) {
            this.props.actionGenerated(actions.STOP_REACTION, item);

            if (this.state.presence === 'online') {
              this.setState({ status: 'online', presence: 'online' });
            } else {
              this.setStatusForUser();
            }
          }
          break;
        }
        default:
          break;
      }
    } catch (error) {
      logger(error);
    }
  };
  showmessageF =()=>{
    showMessage({
      message: "OTOMATİK", 
    description: "Otomatik cümle önerme", 
    type: "success",
    //  icon: "success", 
      // position: "right",
      icon: props => <Icon name="md-create" size={37} color={ "white"} />,
     autoHide:true,
    statusBarHeight:40*heightRatio,
    onPress: () => {
      // this.setState({pushloading:false})
      hideMessage()
    },
    });
  }
  showmessageDisappearing =()=>{
    showMessage({
      message: "PATLAYAN MESAJ", 
    description: "Kaybolan mesaj oluşturma", 
    type: "success",
    //  icon: "success", 
      // position: "right",
      icon: props =>     <Icon name="md-time" size={35} color="white"/>,
      
     autoHide:true,
    statusBarHeight:40*heightRatio,
    onPress: () => {
      // this.setState({pushloading:false})
      hideMessage()
    },
    });
  }
  
  showmessageAnket =()=>{
    showMessage({
      message: "ANKET", 
    description: "Yeni bir anket oluştur", 
    type: "success",
    //  icon: "success", 
      // position: "right",
      icon: props =>    < MCIIcon name="comment-plus-outline" size={44} color="orange"/>,
      
     autoHide:true,
    statusBarHeight:40*heightRatio,
    onPress: () => {
      // this.setState({pushloading:false})
      hideMessage()
    },
    });
  }
  gecicialanMessages=(type)=>{
    var message=type=="anket"? "ANKET":type=="patlayanmesaj"?"KAYBOLAN MESAJ":""
    var description=type=="anket"? "Anket özelliği geçici süre devre dışı bırakılmıştır":type=="patlayanmesaj"?"Kaybolan Mesaj özelliği geçici süre devre dışı bırakılmıştır":""
    showMessage({
      message: message, 
    description: description, 
    type: "danger",
    //  icon: "success", 
      // position: "right",
      //      icon: props =>     <Icon name="md-time" size={35} color="white"/>,

      icon: props => type=="anket"?   < MCIIcon name= "comment-plus-outline" size={44} color="orange"/>:<Icon name="md-time" size={35} color="white"/>,
      
     autoHide:true,
    statusBarHeight:40*heightRatio,
    onPress: () => {
      // this.setState({pushloading:false})
      hideMessage()
    },
    });
  
  }
  paketyukselt=(type)=>{
    // var message=type=="anket"? "PAKET":type=="patlayanmesaj"?"KAYBOLAN MESAJ":""
    var description=type=="anket"? "Anket Özelliğini Kullanabilmeniz İçin Paketinizi Yükseltin":type=="patlayanmesaj"?"Kaybolan Mesaj Özelliğini Kullanabilmeniz İçin Paketinizi Yükseltin":""
   
    showMessage({
      message: "PAKET YÜKSELT", 
    description: description, 
    type: "danger",
    //  icon: "success", 
      // position: "right",
      icon: props => type=="anket"?   < MCIIcon name= "comment-plus-outline" size={44} color="orange"/>:<Icon name="md-time" size={35} color="white"/>,

      // icon: () => <Icon name="md-arrow-up" size={37} color={ "white"} />,
     autoHide:true,
    statusBarHeight:40*heightRatio,
    onPress: () => {
      // this.setState({pushloading:false})
      hideMessage()
    },
    });
  }
  render() {
    let image;
    let userName;
    let presence;
    if (this.props.type === CometChat.RECEIVER_TYPE.USER) {
      image = this.props.item?.avatar;
      userName = this.props.item?.name;
      presence = (
        <CometChatUserPresence
          status={this.state.presence}
          style={{ top: 28 }}
          cornerRadius={9}
          borderColor={this.props.theme.borderColor.white}
          borderWidth={2}
        />
      );
    } else {
      if (this.props.item?.icon) {
        image = this.props.item.icon;
      }
      userName = this.props.item.name;
    }
   var change =this.state.status
   console.log('292',this.state.status);
   change= change.replace('offline', 'çevirimdışı')
   change= change.replace('online', 'çevirimiçi')
   console.log('295',change);
    let status = (
      <Text style={[styles.statusText,{color:"#FFF9C4"}]} numberOfLines={1}>
        {/* {this.state.status} */}
      {change}
      </Text>
    );

    let audioCallBtn = (
      <TouchableOpacity
        onPress={() => this.props.actionGenerated(actions.AUDIO_CALL)}
        style={styles.audioCallContainer}>
        <Image style={styles.callIcon} source={audioCallIcon} />
      </TouchableOpacity>
    );
    let videoCallBtn = (
      <TouchableOpacity
        onPress={() => this.props.actionGenerated(actions.VIDEO_CALL)}
        style={styles.videoCallContainer}>
        <Image source={videoCallIcon} style={styles.videoIcon} />
      </TouchableOpacity>
    );

    if (
      this.props.item?.blockedByMe === true ||
      this.props.audioCall === false ||
      this.props.type === CometChat.ACTION_TYPE.TYPE_GROUP
    ) {
      audioCallBtn = null;
    }

    if (
      this.props.item.blockedByMe === true ||
      this.props.videoCall === false
    ) {
      videoCallBtn = null;
    }
    if (this.props.item.blockedByMe) {
      status = null;
      presence = null;
    }
    if (
      this.props.type === CometChat.ACTION_TYPE.TYPE_USER &&
      this.state.restrictions?.isOneOnOneAudioCallEnabled === false
    ) {
      audioCallBtn = null;
    }

    //if videocall feature is disabled
    if (
      (this.props.type === CometChat.ACTION_TYPE.TYPE_USER &&
        this.state.restrictions?.isOneOnOneVideoCallEnabled === false) ||
      (this.props.type === CometChat.ACTION_TYPE.TYPE_GROUP &&
        this.state.restrictions?.isGroupVideoCallEnabled === false)
    ) {
      videoCallBtn = null;
    }

    let info = (
      <TouchableOpacity
        onPress={() => this.props.actionGenerated(actions.VIEW_DETAIL)}
        style={[styles.videoCallContainer,{paddingHorizontal:3,paddingBottom:2}]}>
        {/* <Image style={[styles.callIcon,{tintColor:"white"}]}  source={detailPaneIcon} /> */}
        <Image style={[[styles.callIcon,{ height: 22,width: 22}],{tintColor:"white"}]}  source={assets.setting} />
      </TouchableOpacity>
    );
////

let aoutowrite = (
  <TouchableOpacity
    onLongPress={()=>{
    this. showmessageF()
    }}
    onPress={() => {
       this.props.actionGenerated(actions.AOUTO_WRİTE)
      var color=this.state.aoutowrite
      console.log('3333',color);
      color=color?false:true
this.setState({aoutowrite:color})
    }
    }
    style={styles.videoCallContainer}>
    {/* <Image style={[styles.callIcon,{tintColor:"white"}]}  source={detailPaneIcon} /> */}
    {/* <Image style={[styles.callIcon,{tintColor:"white"}]}  source={assets.setting} /> */}
   {this.state.aoutowrite? <Icon name="md-create" size={27} color={ "white"} />:
    <Icon name="md-create" size={27} color={"darkgrey"} />
}
  </TouchableOpacity>
);
 
////
////

let Disappearing = (
  <TouchableOpacity
    onLongPress={()=>{
    this. showmessageDisappearing()
    }}
    onPress={() => {
            if(this.props.gecicialan){
              this.gecicialanMessages("patlayanmesaj")
              }else{
                  if(this.props.paket==false){
                    this.paketyukselt("patlayanmesaj")
                  }else{
                this.props.actionGenerated(actions.EXPLOAD)
                var color=this.state.Disappearing
                console.log('3333',color);
                color=color?false:true
                this.setState({Disappearing:color})
              }
              } 
    }}
    style={styles.videoCallContainer}>
    {/* <Image style={[styles.callIcon,{tintColor:"white"}]}  source={detailPaneIcon} /> */}
    {/* <Image style={[styles.callIcon,{tintColor:"white"}]}  source={assets.setting} /> */}
    {this.state.Disappearing?<Icon name="md-time" size={25} color="yellow"/>:
    <Icon name="md-time" size={25} color="white"/>}

   {/* {this.state.Disappearing? <Icon name="md-list" size={25} color={ "white"} />:
    // <Icon name="md-list" size={25} color={"darkgrey"} />
    <Icon name="md-time" size={25} color="white"/>} */}
  </TouchableOpacity>
);
 ////
 let Anket = (
  <TouchableOpacity
    onLongPress={()=>{
    this. showmessageAnket()
    }}
    onPress={() => {
      console.log('567',this.props.gecicialan);
      console.log('567',this.props.paket);
            if(this.props.gecicialan){
            this.gecicialanMessages("anket")
            }else{
                if(this.props.paket==false){
                  this.paketyukselt("anket")
                }else{
                  this.props.actionGenerated(actions.ANKET)
                  var color=this.state.anket
                  console.log('3333',color);
                  color=color?false:true
                  this.setState({anket:color})
                }
            }
          
          }
    }
    style={styles.videoCallContainer}>
    {/* <Image style={[styles.callIcon,{tintColor:"white"}]}  source={detailPaneIcon} /> */}
    {/* <Image style={[styles.callIcon,{tintColor:"white"}]}  source={assets.setting} /> */}
    {this.state.anket?<MCIIcon name="comment-plus-outline" size={24} color="white"/>:
    // <Icon name="md-time" size={25} color="white"/>}
        <MCIIcon name="comment-plus-outline" size={24} color="white" />}

   {/* {this.state.Disappearing? <Icon name="md-list" size={25} color={ "white"} />:
    // <Icon name="md-list" size={25} color={"darkgrey"} />
    <Icon name="md-time" size={25} color="white"/>} */}
  </TouchableOpacity>
);
////
    return (
      <View style={[styles.headerContainer,{backgroundColor:"#558B2F"}]}>
        <TouchableOpacity
          onPress={() => this.props.actionGenerated(actions.GO_BACK)}
          style={styles.backButtonContainer}>
          <Icon
            name="chevron-back-sharp"
            size={32}
            color={this.props.theme.color.white}
          />
        </TouchableOpacity>
        <View style={styles.headerDetailContainer}>
          <View
            style={[
              styles.avatarContainer,
              {
                backgroundColor: "#FF8A80"	,//'rgba(51,153,255,0.25)',
              },
            ]}>
            <CometChatAvatar
              image={{ uri: image }}
              cornerRadius={25}
              borderColor={this.props.theme.borderColor.primary}
              borderWidth={0}
              name={userName}
            />
            {presence}
          </View>
          <View style={[styles.itemDetailContainer]}>
            <Text style={[styles.itemNameText,{color:"white",fontWeight: "700"}]} numberOfLines={1}>
              {this.props.item.name}
            </Text>
            {status}
          </View>
          {/* GÖRÜNTÜLÜ GÖRÜŞME BURAD KAMERA İLE KONUŞMA */}
          {/* {videoCallBtn} */} 
          {/* Telefon ile görüşme */}
          {/* {audioCallBtn} */}
          <View style={{flexDirection:"row",marginTop:28,marginBottom:3}}>
          
            <View style={{justifyContent:"flex-end",alignContent:"flex-end",}}>{Anket}</View>
            <View style={{justifyContent:"flex-end",alignContent:"flex-end",}}>{Disappearing}</View>
            <View style={{justifyContent:"flex-end",alignContent:"flex-end",}}>{aoutowrite}</View>
            <View style={{justifyContent:"flex-end",alignContent:"flex-end",}}>{info}</View>
          
         
          </View>
        </View>
      </View>
    );
  }
}

export default CometChatMessageHeader;
