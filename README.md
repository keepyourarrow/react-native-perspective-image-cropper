# Perspective Image cropper

Document in progress...

## Installation 🚀🚀

`$ npm install https://github.com/keepyourarrow/react-native-perspective-image-cropper.git --save`

`$ react-native link react-native-perspective-image-cropper`

This library uses react-native-svg and react-native-image-size, you must install them too. See https://github.com/react-native-community/react-native-svg and https://github.com/eXist-FraGGer/react-native-image-size for more infos.

#### Android Only

If you do not already have openCV installed in your project, add this line to your `settings.gradle`

```
include ':openCVLibrary310'
project(':openCVLibrary310').projectDir = new File(rootProject.projectDir,'../node_modules/react-native-perspective-image-cropper/android/openCVLibrary310')
```

## Crop image

- Short example

```javascript
<CustomCrop ref={ref => (this.customCrop = ref)} />
```

- Full example :

```javascript
<CustomCrop
	updateImageForViewer={this.updateImageForViewer.bind(this)}
	rectangleCoordinates={DEFAULT_COORDINATES}
    /*
    {
	    topLeft: { x: 0, y: 0 },
	    topRight: { x: 250, y: 0 },
	    bottomRight: { x: 250, y: 250 },
	    bottomLeft: { x: 0, y: 250 },
    }
    */
	initialImage={this.state.initialImage}
	height={this.state.imageHeight}
	width={this.state.imageWidth}
	ref={ref => (this.customCrop = ref)}
	overlayColor="rgba(18,190,210, 1)"
	overlayStrokeColor="rgba(20,190,210, 1)"
	handlerColor="rgba(20,150,160, 1)"
	enablePanStrict={false}
/>
```
