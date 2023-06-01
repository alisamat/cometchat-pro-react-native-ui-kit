import { CometChat } from '@cometchat-pro/react-native-chat';
import { UIKitSettings } from '../../../utils/UIKitSettings';

export class UserListManager {
  userRequest = null;

  userListenerId = `userlist_${new Date().getTime()}`;

  constructor(searchKey,userids,where) {
    this.searchKey = searchKey;
    this.userids = userids;
    this.where = where;
    this.initializeUsersRequest();
  }

  initializeUsersRequest = () => {
    let UIKitSettingsBuilder = new UIKitSettings();
    const userListMode = UIKitSettingsBuilder.userListMode;
    const userListModeOptions = UIKitSettings.userListFilterOptions;

    return new Promise((resolve, reject) => {
       console.log('2000',this.userids,"2222",this.where);
      if (userListMode === userListModeOptions['ALL']) {
        // console.log('2444 1 .alan');
        if (this.searchKey) {
          // console.log('26',this.where);
                if(this.where=="group"){
                  this.usersRequest = new CometChat.UsersRequestBuilder()
                  .setLimit(30)
                  .setSearchKeyword(this.searchKey)
                  .setUIDs(this.userids)
                  .build(this.userids);
                  }else{
                  this.usersRequest = new CometChat.UsersRequestBuilder()
                  .setLimit(30)
                  .setSearchKeyword(this.searchKey)
                  .build();
                }
        }
        
        else {
           if(this.where=="explore"||this.where=="group") {
            console.log('3000',this.userids,this.where);
            this.usersRequest = new CometChat.UsersRequestBuilder()
              .setLimit(30)
              .setUIDs(this.userids)
              .build(this.userids);
              console.log('28 bura',this.usersRequest);
              }else{
              console.log('3000',this.userids,this.where);
              this.usersRequest = new CometChat.UsersRequestBuilder()
              .setLimit(30)
              .build();
              console.log('28 bura',this.usersRequest);
              }
        }

        return resolve(this.usersRequest);
      } else if (userListMode === userListModeOptions['FRIENDS']) {
        console.log('588888 2. alana');
        if (this.searchKey) {
          this.usersRequest = new CometChat.UsersRequestBuilder()
            .setLimit(30)
            .friendsOnly(true)
            .setSearchKeyword(this.searchKey)
            .build();
        } else {
          this.usersRequest = new CometChat.UsersRequestBuilder()
            .setLimit(30)
            .friendsOnly(true)
            .build();
        }

        return resolve(this.usersRequest);
      } else {
        return reject({ message: 'Invalid filter for userlist' });
      }
    });
  };

  fetchNextUsers() {
    return this.usersRequest.fetchNext();
  }

  attachListeners(callback) {
    CometChat.addUserListener(
      this.userListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser) => {
          /* when someuser/friend comes online, user will be received here */
          callback(onlineUser);
        },
        onUserOffline: (offlineUser) => {
          /* when someuser/friend went offline, user will be received here */
          callback(offlineUser);
        },
      }),
    );
  }

  removeListeners() {
    CometChat.removeUserListener(this.userListenerId);
  }
}
