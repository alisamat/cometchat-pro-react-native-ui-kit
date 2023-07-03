/* eslint-disable no-underscore-dangle */
/* eslint-disable max-classes-per-file */
import React, { Component } from 'react';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Dimensions, View, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { logger } from '../../../utils/common';
import styles from './styles';
import KonfetiEylemi from '../../../../../../Components/konfeti'
import * as enums from '../../../utils/enums';
import { CometChat } from '@cometchat-pro/react-native-chat';
const { height: deviceHeight } = Dimensions.get('window');

const ANIMATION_END_Y = Math.ceil(deviceHeight * 0.5);
const NEGATIVE_END_Y = ANIMATION_END_Y * -1;
let startCount = 1;

/**
 * generate random number for hearts.
 * @param min: number
 * @param max: number
 */

function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

class AnimatedHeart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      position: new Animated.Value(0),
      confettiColors: this.generateRandomColors(15),

    };
    this._yAnimation = this.state.position.interpolate({
      inputRange: [NEGATIVE_END_Y, 0],
      outputRange: [ANIMATION_END_Y, 0],
    });

    this._opacityAnimation = this._yAnimation.interpolate({
      inputRange: [0, ANIMATION_END_Y],
      outputRange: [1, 0],
    });

    this._scaleAnimation = this._yAnimation.interpolate({
      inputRange: [0, 15, 30],
      outputRange: [0, 1.2, 1],
      extrapolate: 'clamp',
    });

    this._xAnimation = this._yAnimation.interpolate({
      inputRange: [
        0,
        ANIMATION_END_Y / 5,
        (2 * ANIMATION_END_Y) / 5,
        (3 * ANIMATION_END_Y) / 5,
        (4 * ANIMATION_END_Y) / 5,
        ANIMATION_END_Y,
      ],
      outputRange: [0, -25, -15, 0, 50, 0],
    });

    this._rotateAnimation = this._yAnimation.interpolate({
      inputRange: [
        0,
        ANIMATION_END_Y / 4,
        ANIMATION_END_Y / 3,
        ANIMATION_END_Y / 2,
        ANIMATION_END_Y,
      ],
      outputRange: ['0deg', '-2deg', '0deg', '2deg', '0deg'],
    });
  }
  generateRandomColors = count => {
    const colors = [];

    for (let i = 0; i < count; i++) {
      const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      colors.push(color);
    }

    return colors;
  };
  componentDidMount() {
    Animated.timing(this.state.position, {
      duration: 2000,
      toValue: NEGATIVE_END_Y,
      useNativeDriver: true,
    }).start(this.props.onComplete);
  }

  /**
   * Animation for heart
   * @param
   */

  getHeartAnimationStyle = () => {
    return {
      transform: [
        { translateY: this.state.position },
        { translateX: this._xAnimation },
        { scale: this._scaleAnimation },
        { rotate: this._rotateAnimation },
      ],
      opacity: this._opacityAnimation,
    };
  };

  render() {
    return (
      <Animated.View
        style={[
          styles.heartWrap,
          this.getHeartAnimationStyle(),
          this.props.style,
        ]}>
        <Icon
          name={`${this.props.reactionName || 'heart'}`}
          size={30}
          color="#de3a39"
        />
      </Animated.View>
    );
  }
}

export default class CometChatLiveReactions extends Component {
  state = {
    hearts: [
      {
        id: startCount++,
        right: getRandomNumber(0, 20),
        bottom: getRandomNumber(0, 10),
      },
      {
        id: startCount++,
        right: getRandomNumber(-10, 0),
        bottom: getRandomNumber(20, 30),
      },
      {
        id: startCount++,
        right: getRandomNumber(0, 20),
        bottom: getRandomNumber(40, 50),
      },
      {
        id: startCount++,
        right: getRandomNumber(-10, 0),
        bottom: getRandomNumber(60, 70),
      },
      {
        id: startCount++,
        right: getRandomNumber(0, 20),
        bottom: getRandomNumber(80, 90),
      },
      {
        id: startCount++,
        right: getRandomNumber(-10, 0),
        bottom: getRandomNumber(100, 110),
      },
    ],
  };

  /**
   * remove heart
   * @param v: heart id
   */

  removeHeart = (v) => {
    try {
      const index = this.state.hearts.findIndex((heart) => {
        return heart.id === v;
      });
      this.state.hearts.splice(index, 1);
      this.setState(this.state);
    } catch (error) {
      logger(error);
    }
  };

  render() {
    return (
      <View style={[styles.container,{zIndex:2222}]}>
        <ConfettiCannon 
   count={22}
   origin={{ x: 210, y: 0 }}
   fadeOut={false}
   colors={this.state.confettiColors}
   explosionSpeed={2222}
   fallSpeed={2222}
 />s
 {/* <KonfetiEylemi/> */}
        {/* {this.state.hearts.map(function (v, i) {
          return (
            // <AnimatedHeart
            //   key={v.id}
            //   item={this.props.item}
            //   type={this.props.type}
            //   // eslint-disable-next-line react/jsx-no-bind
            //   onComplete={this.removeHeart.bind(this, v.id)}
            //   style={{
            //     right: this.state.hearts[i].right,
            //     bottom: this.state.hearts[i].bottom,
            //   }}
            // />
                     ///// BURAD ÇALIŞma  VAR
//  <View style={style.reactionsWrapperStyle}>
 <ConfettiCannon 
   count={300}
   origin={{ x: -10, y: 0 }}
   fadeOut={true}
   colors={this.state.confettiColors}
   explosionSpeed={500}
   fallSpeed={1300}
 />
          //  </View>
 ///// BURAD ÇALIŞma  VARSONU
          );
        }, this)} */}
      </View>
    );
  }
}
