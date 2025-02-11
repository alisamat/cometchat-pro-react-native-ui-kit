import { CometChat } from '@cometchat-pro/react-native-chat';
import { UIKitSettings } from '../../../utils/UIKitSettings';
export class AddMembersManager {
  membersRequest = null;

  userListenerId = `add_member_user_${new Date().getTime()}`;

  constructor(searchKey,memberIDs) {
    this.searchKey = searchKey;
    this.memberIDs = memberIDs;

  }
  initializeMembersRequest = () => {
    let UIKitSettingsBuilder = new UIKitSettings();
    const userListMode = UIKitSettingsBuilder.userListMode;
    const userListModeOptions = UIKitSettings.userListFilterOptions;

    return new Promise((resolve, reject) => {
      console.log('1717',this.memberIDs); //.setUIDs(this.memberIDs)
      if (userListMode === userListModeOptions['ALL']) {
        if (this.searchKey) {
          this.membersRequest = new CometChat.UsersRequestBuilder()
            .setLimit(30)
            .setSearchKeyword(this.searchKey)
            .setUIDs(this.memberIDs)
            .build();
        } else {
          this.membersRequest = new CometChat.UsersRequestBuilder()
            .setLimit(30)
            .setUIDs(this.memberIDs)
            .build();
        }

        return resolve(this.membersRequest);
      } else if (userListMode === userListModeOptions['FRIENDS']) {
        if (this.searchKey) {
          this.membersRequest = new CometChat.UsersRequestBuilder()
            .setLimit(30)
            .friendsOnly(true)
            .setSearchKeyword(this.searchKey)
            .setUIDs(this.memberIDs)
            .build();
        } else {
          this.membersRequest = new CometChat.UsersRequestBuilder()
            .setLimit(30)
            .friendsOnly(true)
            .setUIDs(this.memberIDs)
            .build();
        }

        return resolve(this.membersRequest);
      } else {
        return reject({ message: 'Invalid filter for userlist' });
      }
    });
  };

  fetchNextUsers() {
    return this.membersRequest.fetchNext();
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
