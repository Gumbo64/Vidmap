import BlankSpacer from "react-native-blank-spacer";

import YoutubePlayer from "react-native-youtube-iframe";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Alert, Text, Image, View, StyleSheet, Dimensions} from 'react-native';
import Constants from 'expo-constants';
import * as Location from 'expo-location';


import MapView from "react-native-map-clustering";
// import MapView from "react-native-maps"
import { Marker, Polyline } from "react-native-maps";


import { getStatusBarHeight } from "react-native-status-bar-height";

import { FAB, Portal, Provider } from 'react-native-paper';
import { Button} from 'react-native-paper';
import { Appbar } from 'react-native-paper';
import { TextInput } from 'react-native-paper';




// import Wholemenu from './makemarkermenu';




const INITIAL_REGION = {
  latitude: -33,
  longitude: 150,
  latitudeDelta: 8.5,
  longitudeDelta: 8.5,
};
function latlong(lat,long){
  return {"latitude":parseFloat(lat),"longitude":parseFloat(long)}
}
function makemarker(id,latitude,longitude,title,videoid){
  return ({"id":id,"coordinates":latlong(latitude,longitude),"title":title,"videoid":videoid,})
}



const serverlocation = 'https://vidmap.herokuapp.com'
var manualvid = false
var clustertoggle = true
var selectinglocation = false




function submitmarker(formlink,pos,formtitle){
  (async () => {
        let submitresponse = await fetch(serverlocation+"/submit", {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                      "latitude": pos.latitude,
                                      "longitude": pos.longitude,
                                      "link": formlink,
                                      "title":formtitle,
                                      
                                    })
                                  });
        submitresponse = await submitresponse.json()
        Alert.alert(submitresponse)
    })();

  return
}




export default function App() {
  const mapRef = useRef();

  function animateToRegion(){
    let delt = 0.001
    // minus delt/2 is a bandaid fix because the animateToRegion function finishes with the marker at the bottom of the window instead of being centered in the middle. 
    let region = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: delt,
      longitudeDelta: delt,
    };

    mapRef.current.animateToRegion(region, 1500);
    }
  const [playing, setPlaying] = useState(false);

  const onStateChange = useCallback((state) => {
    if (state === "ended") {
      setPlaying(false);
      console.log("video has finished playing!");
    }
  }, []);

  const togglePlaying = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  const [location, setLocation] = useState(latlong(-34.0075,151.125));
  const [vidmarkers, setvidmarkers] = useState(null);
  const [currentVidID, setCurrentVid] = useState('');

  const [random, setRandom] = useState(Math.random());
  const reRender = () => setRandom(Math.random());

  // action button stuff
  const [state, setState] = React.useState({ open: false });

  const FABStateChange = ({ open }) => setState({ open });

  const { open } = state;


  // submitting markers data
  const [formlink, setformlink] = useState('');
  const [formtitle, setformtitle] = useState('');
  const [formlocation, setformlocation] = useState(latlong(-33,150));






  function locationhandle(){
      // console.log('outside async')
      (async () => {
        let templocation = await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});
        // once the location is recieved, it uses setLocation which triggers another render, looping indefinitely and will keep updating location which is what we want
        
        setLocation(latlong(parseFloat(JSON.stringify(templocation.coords.latitude)),parseFloat(JSON.stringify(templocation.coords.longitude))));
        
      })();
  }
  function newmarkershandle(){
    (async () => {
        let vidmarkers = await fetch(serverlocation);
        vidmarkers = await vidmarkers.json()
        setvidmarkers(vidmarkers);
    })();
  }


  useEffect(() => {
    var locationinterval = setInterval(locationhandle, 2000);
    // setInterval(newmarkershandle, 2000);
    (async () => {
      // setInterval(locationhandle, 2000);
      newmarkershandle()
      await Location.requestPermissionsAsync();



    })();
  }, []);
  







  let vidlist 
  if (!vidmarkers || vidmarkers.length==0){
    vidlist = [makemarker('memes',-33,151,'yee','q6EoRBvdVPQ')]

  }else{  
    vidlist = vidmarkers
  }
  
// if we don't have a manual override then use the closest marker

  var viddistances = []
  var closestvidindex = 0
  var closestvid_id = ''


  viddistances = vidlist.map(function(val, index){
    return Math.hypot(val.coordinates.latitude-location.latitude,val.coordinates.longitude-location.longitude);
  })
  closestvidindex = viddistances.indexOf(Math.min.apply(null,viddistances))
  
  closestvid_id = vidlist[closestvidindex].videoid

  if (closestvid_id !== currentVidID && !manualvid){
    setCurrentVid(closestvid_id)
  }




  

  if (!selectinglocation){
    return(
      <Provider>
      <View style={styles.container}>
        <View>
          <BlankSpacer height={getStatusBarHeight()}/>
          <YoutubePlayer 
            height={Dimensions.get('window').width/16*9}
            width = {Dimensions.get('window').width}
            play={playing}
            videoId={currentVidID}
            onChangeState={onStateChange}
          />



        </View>

        <View style={styles.mapholder}>
          <MapView clusteringEnabled={clustertoggle} ref={mapRef} initialRegion={INITIAL_REGION} style={ styles.map } onPress={e => {manualvid = false}}>
              {vidlist.map((item, index) => (
                
                <Marker key={index} title={item.title} coordinate={item.coordinates} onPress = {()=> {setCurrentVid(item.videoid); manualvid=true }}>
                    <Image source={{uri: 'http://img.youtube.com/vi/'+item.videoid+'/default.jpg'}} style={{height: 35, width:35 }}/>
                </Marker>
              ))}
              <Polyline
                key={"-2"}
                coordinates={[location,latlong(vidlist[closestvidindex].coordinates.latitude,vidlist[closestvidindex].coordinates.longitude)]}
                strokeColor="#000"
                fillColor="rgba(255,0,0,0.5)"
                strokeWidth={3}></Polyline>
            <View>
              <Marker key={"-1"} coordinate={location} title={'You'}>
              <Image source={require('./you.png')} style={{height: 35, width:35 }} />
              </Marker>
            </View>


          </MapView>
        </View>

          <Portal>
          <FAB.Group
            open={open}
            icon={open ? 'map-marker-plus' : 'plus'}
            actions={[
              {
                icon: 'map-marker-circle',
                label: 'Go to current location',
                onPress: () => animateToRegion(),
              },
              {
                icon: 'refresh',
                label: 'Refresh markers',
                onPress: () => {newmarkershandle()},
              },
              {
                icon: 'scatter-plot',
                label: 'Toggle clustering',
                onPress: () => clustertoggle = !clustertoggle,
                // small: false,
              },
            ]}
            onStateChange={FABStateChange}
            onPress={() => {
              if (open) {
                // when the button is clicked again
                selectinglocation = true
                setformlocation(location)
                setformlink('')
                setformtitle('')
              }
            }}
          />
        </Portal>

      </View>
      </Provider>

    
    )
  }else{
    
    return (
      <Provider>
        <Appbar.Header>
          <Appbar.BackAction onPress={()=>{selectinglocation = false; reRender()}} />
          <Appbar.Content title="Submit a new marker" subtitle="Click on the map or hold on marker to move" />

        </Appbar.Header>
        <View style={styles.selectormapholder}>
          <MapView clusteringEnabled={clustertoggle} ref={mapRef} initialRegion={INITIAL_REGION} style={ styles.map } onPress={e => {setformlocation(e.nativeEvent.coordinate)}}>
              {vidlist.map((item, index) => (
                
                <Marker key={index} title={item.title} coordinate={item.coordinates} onPress = {()=> {setCurrentVid(item.videoid); manualvid=true }}>
                    <Image source={{uri: 'http://img.youtube.com/vi/'+item.videoid+'/default.jpg'}} style={{height: 35, width:35 }}/>
                </Marker>
              ))}
              <Polyline
                key={"-2"}
                coordinates={[location,latlong(vidlist[closestvidindex].coordinates.latitude,vidlist[closestvidindex].coordinates.longitude)]}
                strokeColor="#000"
                fillColor="rgba(255,0,0,0.5)"
                strokeWidth={3}></Polyline>
            <View>
              <Marker key={"-1"} coordinate={location} title={'You'}>
              <Image source={require('./you.png')} style={{height: 35, width:35 }} />
              </Marker>
            </View>
            <View>
              <Marker draggable key={"-10"} coordinate={formlocation} title={'Your new marker'} onDragEnd={(e) => setformlocation(e.nativeEvent.coordinate)}>


              </Marker>
            </View>


          </MapView>
        </View>
        <TextInput 
          label="Marker title"
          value={formtitle}
          onChangeText={formtitle => setformtitle(formtitle)}
          maxLength={25}
        />
        <TextInput 
          label="Youtube link e.g. https://youtu.be/yh59FEUOWxQ"
          value={formlink}
          onChangeText={formlink => setformlink(formlink)}
          maxLength={40}
        />

        <Button  mode="contained" onPress={() => {animateToRegion()}}><Text>{'Go to current location'}</Text></Button>
        <Button  mode="contained" onPress={() => {submitmarker(formlink,formlocation,formtitle); selectinglocation = false; reRender()}}><Text>{'Submit'}</Text></Button>
      </Provider>
          

    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'stretch',
    justifyContent:'space-between',
    flexDirection:"column"
  },
  map: {
    flex:1,
    // width: Dimensions.get('window').width,
    // height: Dimensions.get('window').height,
  },
  mapholder: {
    zIndex:1,
    width:Dimensions.get('window').width, 

    // minus the youtube player off the top
    height:Dimensions.get('window').height-Dimensions.get('window').width/16*9,
  },
  selectormapholder: {
    zIndex:1,
    width:Dimensions.get('window').width, 

    // basically the same as the other mapholder but less tall
    height:Dimensions.get('window').height/3,
  },
  
  // above: {
  //   width: Dimensions.get('window').width,
  //   height: Dimensions.get('window').height,
    
  //   position: 'absolute',
  //   bottom: 0,
  //   right: 0,
  //   // margin:15,
  //   zIndex: 10,
  //   elevation: 10,

  // },
  // actionbutton: {

  //   height: 100,
  //   width: 100,
  //   borderRadius: 50,
  //   position: 'absolute',
  //   bottom: 0,
  //   right: 0,
  //   margin:15,
  //   zIndex: 10,


  // },
});