
import React, { Component } from 'react';
import {
    NativeModules,
    PanResponder,
    Dimensions,
    Image,
    View,
    Animated,
    Platform
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

const horizontalPadding = 40;
class CustomCrop extends Component {
    constructor(props) {
        super(props);
        this.state = {
            viewHeight:
               ( Dimensions.get('window').width * (props.height / props.width)),
            viewWidth: Dimensions.get('window').width - horizontalPadding,
            height: props.height,
            width: props.width,
            image: props.initialImage,
            moving: false,
            screenRatio: Dimensions.get('screen').height / Dimensions.get('screen').width,
            imageVerticalOffset:0,
            imageHeight: 0,
            imageWidth: 0
        };

        this.state = {
            ...this.state,
            topLeft: new Animated.ValueXY(
                props.rectangleCoordinates
                    ? this.imageCoordinatesToViewCoordinates(
                        {
                            x: Platform.OS === 'android' ? props.rectangleCoordinates.topLeft.x
                                : props.rectangleCoordinates.topLeft.x * this.getCoordinateScaling(),
                            y: Platform.OS === 'android' ? props.rectangleCoordinates.topLeft.y
                                : props.rectangleCoordinates.topLeft.y * this.getCoordinateScaling()
                        },
                        true,
                    )
                    : { x: 100, y: 100 },
            ),
            topRight: new Animated.ValueXY(
                props.rectangleCoordinates
                    ? this.imageCoordinatesToViewCoordinates(
                        {
                            x: Platform.OS === 'android' ?
                                props.rectangleCoordinates.topRight.x :
                                props.rectangleCoordinates.bottomLeft.x * this.getCoordinateScaling(),
                            y: Platform.OS === 'android' ? props.rectangleCoordinates.topRight.y
                                : props.rectangleCoordinates.bottomLeft.y * this.getCoordinateScaling()
                        },
                        true,
                    )
                    : { x: this.state.viewWidth - 100, y: 100 },
            ),
            bottomLeft: new Animated.ValueXY(
                props.rectangleCoordinates
                    ? this.imageCoordinatesToViewCoordinates(
                        {
                            x: Platform.OS === 'android' ?
                                props.rectangleCoordinates.bottomLeft.x :
                                props.rectangleCoordinates.topRight.x * this.getCoordinateScaling(),
                            y: Platform.OS === 'android' ? props.rectangleCoordinates.bottomLeft.y
                                : props.rectangleCoordinates.topRight.y * this.getCoordinateScaling()
                        },
                        true,
                    )
                    : { x: 100, y: this.state.viewHeight - 100 },
            ),
            bottomRight: new Animated.ValueXY(
                props.rectangleCoordinates
                    ? this.imageCoordinatesToViewCoordinates(
                        {
                            x: Platform.OS === 'android' ?
                                props.rectangleCoordinates.bottomRight.x :
                                props.rectangleCoordinates.bottomRight.x * this.getCoordinateScaling(),
                            y: Platform.OS === 'android' ? props.rectangleCoordinates.bottomRight.y
                                : props.rectangleCoordinates.bottomRight.y * this.getCoordinateScaling()
                        },
                        true,
                    )
                    : {
                        x: this.state.viewWidth - 100,
                        y: this.state.viewHeight - 100,
                    },
            ),
        };
        this.state = {
            ...this.state,
            overlayPositions: `${this.state.topLeft.x._value},${this.state.topLeft.y._value
                } ${this.state.topRight.x._value},${this.state.topRight.y._value} ${this.state.bottomRight.x._value
                },${this.state.bottomRight.y._value} ${this.state.bottomLeft.x._value
                },${this.state.bottomLeft.y._value}`,
        };

        this.panResponderTopLeft = this.createPanResponser(this.state.topLeft);
        this.panResponderTopRight = this.createPanResponser(
            this.state.topRight,
        );
        this.panResponderBottomLeft = this.createPanResponser(
            this.state.bottomLeft,
        );
        this.panResponderBottomRight = this.createPanResponser(
            this.state.bottomRight,
        );
    }

    createPanResponser(corner) {
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event([
                null,
                {
                    dx: corner.x,
                    dy: corner.y,
                },
            ]),
            onPanResponderRelease: () => {
                corner.flattenOffset();
                this.updateOverlayString();
            },
            onPanResponderGrant: () => {
                corner.setOffset({ x: corner.x._value, y: corner.y._value });
                corner.setValue({ x: 0, y: 0 });
            },
        });
    }

    crop() {
        let horizontalOffset = 20;

        let topLeft = {
            x: this.adjustOutOfBounds(this.objectToInt(this.state.topLeft.x) - horizontalOffset, 'width'),
            y: this.adjustOutOfBounds(this.state.topLeft.y,'height')
        },

        topRight = {
            x: this.adjustOutOfBounds(this.objectToInt(this.state.topRight.x) + horizontalOffset, 'width'),
            y: this.adjustOutOfBounds(this.state.topRight.y,'height')
        },

        bottomLeft = {
            x: this.adjustOutOfBounds(this.objectToInt(this.state.bottomLeft.x) - horizontalOffset, 'width'),
            y: this.adjustOutOfBounds(this.state.bottomLeft.y,'height')
        },

        bottomRight = {
            x: this.adjustOutOfBounds(this.objectToInt(this.state.bottomRight.x) + horizontalOffset, 'width'),
            y: this.adjustOutOfBounds(this.state.bottomRight.y,'height')
        }
        console.log({bottomRight, height:this.state.viewHeight, width:this.state.viewWidth});

        const coordinates = {
            topLeft: this.viewCoordinatesToImageCoordinates(topLeft),
            topRight: this.viewCoordinatesToImageCoordinates(
                topRight,
            ),
            bottomLeft: this.viewCoordinatesToImageCoordinates(
                bottomLeft,
            ),
            bottomRight: this.viewCoordinatesToImageCoordinates(
                bottomRight,
            ),
            height: this.state.height,
            width: this.state.width,
        };

        NativeModules.CustomCropManager.crop(
            coordinates,
            this.state.image,
            (err, res) => this.props.updateImageForViewer(res.image, coordinates),
        );
    }

    updateOverlayString() {

        let horizontalOffset = 20; //padding
        let verticalOffset = 1.5;

        let topLeftX = this.adjustOutOfBounds(this.state.topLeft.x._value,'width') + horizontalOffset
        let topLeftY = this.adjustOutOfBounds(this.state.topLeft.y._value,'height') + verticalOffset
        let topRightX = this.adjustOutOfBounds(this.state.topRight.x._value,'width') + horizontalOffset
        let topRightY = this.adjustOutOfBounds(this.state.topRight.y._value,'height') + verticalOffset
        let bottomRightX = this.adjustOutOfBounds(this.state.bottomRight.x._value,'width') + horizontalOffset
        let bottomRightY = this.adjustOutOfBounds(this.state.bottomRight.y._value,'height') + verticalOffset
        let bottomLeftX = this.adjustOutOfBounds(this.state.bottomLeft.x._value,'width') + horizontalOffset
        let bottomLeftY = this.adjustOutOfBounds(this.state.bottomLeft.y._value ,'height') + verticalOffset
        console.log({topLeftX,topLeftY, topRightX,topRightY,bottomRightX,bottomRightY,bottomLeftX,bottomLeftY, height:this.state.viewHeight,width:this.state.viewWidth});

        this.setState({
            overlayPositions: `${topLeftX},${topLeftY} ${topRightX},${topRightY
            } ${bottomRightX},${bottomRightY} ${bottomLeftX},${bottomLeftY}`,
        });
    }

    imageCoordinatesToViewCoordinates(corner) {
        return {
            x: (corner.x),
            y: (corner.y),
        };
    }

    viewCoordinatesToImageCoordinates(corner) {
        return {
            x: (corner.x / this.state.viewWidth) *
                this.state.width,
            y: (corner.y / this.state.viewHeight) * this.state.height
        };
    };

    getCoordinateScaling() {
        return (this.props.width / this.state.viewHeight) * 1.20
    }

    adjustHorizontalOffset(x) {
        x = parseInt(JSON.stringify(x))
        return x + horizontalPadding /2;
    }

    adjustOutOfBounds(point,type) {

        if (typeof point == 'object') {
            point = this.objectToInt(point);
        }

        if (point < 0) {
            return 0;
        }

        if (type == 'height' && point > this.state.viewHeight) {
            return this.state.viewHeight
        } else if (type == 'width' && point > this.state.viewWidth) {
            return this.state.viewWidth;
        }

        return point;
    }
    objectToInt(point) {
        return parseInt(JSON.stringify(point));
    }


    render() {
        return (
            <View
                style={{
                    height: "100%",
                    width: "100%",
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                }}
                onLayout={event => {
                    const layout = event.nativeEvent.layout;
                    this.setState({
                        imageVerticalOffset:layout.y
                    })
                    this.updateOverlayString()
                  }}
            >
                <View
                    style={[
                        s(this.props).cropContainer,
                        { height: "100%" },
                    ]}
                >
                    <Image
                        style={[
                            s(this.props).image,
                            { height: "100%" },
                        ]}
                        resizeMode="stretch"
                        source={{ uri: this.state.image }}
                        onLayout={event => {
                            const layout = event.nativeEvent.layout;
                            this.setState({
                                viewHeight: layout.height,
                                viewWidth : layout.width
                            })
                          }}
                    />
                    <Svg
                        height={this.state.viewHeight + 3.5}
                        width={this.adjustHorizontalOffset(this.state.viewWidth + 4)}
                        style={{ position: 'absolute', left: 0, top: 0 }}
                    >
                        <AnimatedPolygon
                            ref={(ref) => (this.polygon = ref)}
                            fill={this.props.overlayColor || 'blue'}
                            fillOpacity={this.props.overlayOpacity || 0.5}
                            stroke={this.props.overlayStrokeColor || 'blue'}
                            points={this.state.overlayPositions}
                            strokeWidth={this.props.overlayStrokeWidth || 3}
                        />
                    </Svg>
                    <Animated.View
                        {...this.panResponderTopLeft.panHandlers}
                        style={[
                            {left: this.adjustHorizontalOffset(this.adjustOutOfBounds(this.state.topLeft.x,'width')),
                                top: this.adjustOutOfBounds(this.state.topLeft.y,'height')
                            },
                            s(this.props).handler,
                        ]}
                    >
                        <View
                            style={[
                                s(this.props).handlerI,
                                { left: 0, top: 0 },
                            ]}
                        />
                        <View
                            style={[
                                s(this.props).handlerRound,
                                { left: 9, top: 11 },
                            ]}
                        />
                    </Animated.View>
                    <>
                        <Animated.View
                            {...this.panResponderTopRight.panHandlers}
                            style={[
                                {left: this.adjustHorizontalOffset(this.adjustOutOfBounds(this.state.topRight.x,'width')),
                                    top: this.adjustOutOfBounds(this.state.topRight.y,'height')
                                },
                                s(this.props).handler,
                            ]}
                        >
                            <View
                                style={[
                                    s(this.props).handlerI,
                                    { left: 0, top: 0 },
                                ]}
                            />
                            <View
                                style={[
                                    s(this.props).handlerRound,
                                    { left: 9, bottom: 18 },
                                ]}
                            />
                        </Animated.View>
                        <Animated.View
                            {...this.panResponderBottomLeft.panHandlers}
                            style={[
                                {left: this.adjustHorizontalOffset(this.adjustOutOfBounds(this.state.bottomLeft.x,'width')),
                                    top: this.adjustOutOfBounds(this.state.bottomLeft.y,'height')
                                },
                                s(this.props).handler,
                            ]}
                        >
                            <View
                                style={[
                                    s(this.props).handlerI,
                                    { left: 0, top: 0 },
                                ]}
                            />
                            <View
                                style={[
                                    s(this.props).handlerRound,
                                    { right: 22, top: 12 },
                                ]}
                            />
                        </Animated.View>
                    </>
                    <Animated.View
                        {...this.panResponderBottomRight.panHandlers}
                        style={[
                            {left: this.adjustHorizontalOffset(this.adjustOutOfBounds(this.state.bottomRight.x,'width')),
                                top: this.adjustOutOfBounds(this.state.bottomRight.y,'height')
                            },
                            s(this.props).handler,
                        ]}
                    >
                        <View
                            style={[
                                s(this.props).handlerI,
                                { left: 0, top: 0 },
                            ]}
                        />
                        <View
                            style={[
                                s(this.props).handlerRound,
                                { right: 22, bottom: 19 },
                            ]}
                        />
                    </Animated.View>
                </View>
            </View>
        );
    }
}

const s = (props) => ({
    handlerI: {
        borderRadius: 50,
        height: 10,
        width: 0,
        backgroundColor: props.handlerColor || 'blue',
        zIndex: 9999
    },
    handlerRound: {
        width: 21.2,
        position: 'absolute',
        height: 19.6,
        borderRadius: 100,
        // backgroundColor: props.handlerColor || 'blue',
        zIndex: 9999,
        borderWidth: 4,
        borderColor: props.borderColor || 'blue'
    },
    // handlerRoundOuter: {
    //     width: 70.2,
    //     position: 'absolute',
    //     height: 70.2,
    //     borderRadius: 150,
    //     backgroundColor: props.handlerOuterColor || 'blue',
    //     zIndex: 9998
    // },
    image: {
        width:"100%"
    },
    handler: {
        height: 50,
        width: 52,
        overflow: 'visible',
        marginLeft: -20,
        marginTop: -20,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        // backgroundColor:"teal"
    },
    cropContainer: {
        position: 'absolute',
        left: 0,
        width: "100%",
        top: 0,
        paddingHorizontal:20,
        paddingBottom: 160,
    },
});

export default CustomCrop;