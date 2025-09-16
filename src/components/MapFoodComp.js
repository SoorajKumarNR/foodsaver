import React, { Component } from 'react';
import { withGoogleMap, GoogleMap, withScriptjs, InfoWindow, Marker } from "react-google-maps";
import Geocode from "react-geocode";

const apiUrl = process.env.REACT_APP_API_URL;

Geocode.setApiKey(process.env.REACT_APP_MAP_API);
Geocode.enableDebug();

class MapFoodComp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      address: '',
      city: '',
      area: '',
      state: '',
      mapPosition: {
        lat: this.props.center.lat,
        lng: this.props.center.lng
      },
      markerPosition: {
        lat: this.props.center.lat,
        lng: this.props.center.lng
      },
      foodRequests: []  // State to hold data fetched from backend
    };
  }

  componentDidMount() {
    Geocode.fromLatLng(this.state.mapPosition.lat, this.state.mapPosition.lng).then(
      response => {
        const address = response.results[0].formatted_address,
          addressArray = response.results[0].address_components,
          city = this.getCity(addressArray),
          area = this.getArea(addressArray),
          state = this.getState(addressArray);

        this.setState({
          address: address ? address : '',
          area: area ? area : '',
          city: city ? city : '',
          state: state ? state : '',
        });
      },
      error => {
        console.error("Geocode error:", error);
      }
    );

    // Fetch food requests from backend API on component mount
    this.fetchFoodRequests();
  }

  fetchFoodRequests = () => {
    fetch(`${apiUrl}/request`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // Add auth headers here if your API requires authentication
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch food requests!');
        return res.json();
      })
      .then(data => {
        this.setState({ foodRequests: data });
      })
      .catch(err => {
        console.error("API fetch error:", err);
      });
  };

  shouldComponentUpdate(nextProps, nextState) {
    if (
      this.state.markerPosition.lat !== this.props.center.lat ||
      this.state.address !== nextState.address ||
      this.state.city !== nextState.city ||
      this.state.area !== nextState.area ||
      this.state.state !== nextState.state ||
      this.state.foodRequests !== nextState.foodRequests
    ) {
      return true;
    } else if (this.props.center.lat === nextProps.center.lat) {
      return false;
    }
  }

  getCity = (addressArray) => {
    let city = '';
    for (let i = 0; i < addressArray.length; i++) {
      if (addressArray[i].types[0] && 'administrative_area_level_2' === addressArray[i].types[0]) {
        city = addressArray[i].long_name;
        return city;
      }
    }
  };

  getArea = (addressArray) => {
    let area = '';
    for (let i = 0; i < addressArray.length; i++) {
      if (addressArray[i].types[0]) {
        for (let j = 0; j < addressArray[i].types.length; j++) {
          if ('sublocality_level_1' === addressArray[i].types[j] || 'locality' === addressArray[i].types[j]) {
            area = addressArray[i].long_name;
            return area;
          }
        }
      }
    }
  };

  getState = (addressArray) => {
    let state = '';
    for (let i = 0; i < addressArray.length; i++) {
      if (addressArray[i].types[0] && 'administrative_area_level_1' === addressArray[i].types[0]) {
        state = addressArray[i].long_name;
        return state;
      }
    }
  };

  onInfoWindowClose = (event) => {
    // You can handle InfoWindow close event here if needed
  };

  render() {
    const AsyncMap = withScriptjs(
      withGoogleMap(
        props => (
          <GoogleMap
            google={this.props.google}
            defaultZoom={this.props.zoom}
            defaultCenter={{ lat: this.state.mapPosition.lat, lng: this.state.mapPosition.lng }}>
            <InfoWindow
              onClose={this.onInfoWindowClose}
              position={{ lat: this.state.markerPosition.lat + 0.0018, lng: this.state.markerPosition.lng }}>
              <div>
                <span style={{ padding: 0, margin: 0 }}>{this.state.address}</span>
              </div>
            </InfoWindow>
            <Marker
              google={this.props.google}
              name={'Dolores park'}
              draggable={false}
              position={{ lat: this.state.markerPosition.lat, lng: this.state.markerPosition.lng }}
            />
            <Marker />
          </GoogleMap>
        )
      )
    );

    let map;
    if (this.props.center.lat !== undefined) {
      map = (
        <div>
          <div>
            <h4>Available Food Requests: {this.state.foodRequests.length}</h4>
            <ul>
              {this.state.foodRequests.map(request => (
                <li key={request._id || request.id}>{request.foodName || JSON.stringify(request)}</li>
              ))}
            </ul>
          </div>

          <AsyncMap
            googleMapURL={`https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_MAP_API}&libraries=places`}
            loadingElement={<div style={{ height: '70%', width: '100%' }} />}
            containerElement={<div style={{ height: this.props.height, width: '100%' }} />}
            mapElement={<div style={{ height: '100%' }} />}
          />
        </div>
      );
    } else {
      map = <div style={{ height: this.props.height }} />;
    }
    return map;
  }
}

export default MapFoodComp;
