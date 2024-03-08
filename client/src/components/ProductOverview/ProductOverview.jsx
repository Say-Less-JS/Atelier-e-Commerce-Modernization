import React, { useState, useEffect, useRef } from 'react';
import ProductInformation from './ProductInformation.jsx';
import Styles from './Styles.jsx';
import SelectOptions from './SelectOptions.jsx';
import SloganDescFeat from './SloganDescFeat.jsx';
import ImageGallery from './ImageGallery.jsx';
import ImageGalleryV1 from './ImageGalleryV1.jsx';
import Modal from './Modal.jsx';
import fetchData from './fetchData.js';
import axios from 'axios';
import { FaFacebookSquare, FaPinterestSquare, FaCheck, FaHeart } from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";

// ProductOverview Component
const ProductOverview = React.memo(({ setCartData, id, authKey, onClickReadAllReviews }) => {

  // State variables for product, styles, reviews, selected style, and current style id
  const [productData, setProductData] = useState(null);
  const [stylesData, setStylesData] = useState(null);
  const [reviewsData, setReviewsData] = useState(null);

  const [selectedStyle, setSelectedStyle] = useState(null);
  const [currentStyleId, setCurrentStyleId] = useState(null);

  // State variables for available sizes and quantity
  // const [availableSizes, setAvailableSizes] = useState([]);
  const [availableQuantities, setavailableQuantities] = useState([]);

  // State variable for error messages - separate this eventually
  const [errorMessages, setErrorMessages] = useState([]);

  // State variable to track the selected quantity, default is "-"
  const [selectedQuantity, setSelectedQuantity] = useState('-');
  const [selectedSize, setSelectedSize] = useState('');

  // to trigger the opening the select size menu option
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // State of California LA... SKU and cart stuff
  const [currentSKUs, setCurrentSKUs] = useState([]);
  const [SKU, setSKU] = useState('');
  const [cartDataUpdated, setCartDataUpdated] = useState(false);

  // ref for select size option (trying to make it to open in add to cart button click and no size is selected)
  const selectSizeRef = useRef(null);

  // to many state variables, wonder if I can combine them
  const [showModalCartItem, setShowModalCartItem] = useState(false);

  // Fetching data from API on component mount
  useEffect(() => {
    if (!cartDataUpdated) {
      // Call fetchData function
      fetchData(
        id,
        authKey,
        setProductData,
        setStylesData,
        setReviewsData,
        setCurrentStyleId,
        setSelectedStyle,
        setavailableQuantities,
        setCurrentSKUs
      );
    }
  }, [id, authKey, cartDataUpdated]);

  // Function to handle style change from the Styles component
  const handleStyleChange = (styleId) => {
    if (styleId !== currentStyleId) {
      setCurrentStyleId(styleId);
      // set the style selected data to pass it to the ProductInformation component
      setSelectedStyle(stylesData.results.find(style => style.style_id === styleId));
      // set the sizes data to pass it to the SelectOptions component
      // setAvailableSizes(Object.values(selectedStyle.skus).map(sku => sku.size));
      setCurrentSKUs(
      Object.entries(selectedStyle.skus).map(sku => sku));
      // set available quantity for current style to pass it to the SelectOptions component
      const quantities = Object.values(selectedStyle.skus).map(sku => sku.quantity);
      const totalQuantity = quantities.length > 0 ? Math.min(...quantities) : 0;
      setavailableQuantities(totalQuantity);
      // console.log(selectedSize)
    }
  };

  // Funtion to handle change on size selection
  const handleSizeSelection = (e) => {
    // set the SKU on size selection to use it in the cart
    setSKU(e.target.selectedOptions[0].getAttribute('sku'));
    // set current selected size
    setSelectedSize(e.target.value);
    if (e.target.value === 'selectSize') {
      setSelectedQuantity('-');
    } else {
      setSelectedQuantity('1');
    }
    setErrorMessages([]);
    setIsDropdownOpen(false)
  };

  const ErrorMessages = ({ messages }) => (
    <div>
      {messages.map((message, index) => (
        <p key={index} style={{ color: '#F4493C' }}>{message}</p>
      ))}
    </div>
  );

  const handleShareClick = (platform) => {
    alert(`Sharing product SKU ${currentStyleId} on ${platform}`);
  };

  const handleAddToCart = () => {
    const { value: selectedSize } = selectSizeRef.current;
    // Validate selected size and quantity
    if (selectedSize === "selectSize" || selectedSize.trim() === "") {
      setErrorMessages(["Please select size"]);
      selectSizeRef.current.focus();
      setIsDropdownOpen(true)
      return;
    }
    if (isNaN(selectedQuantity) || selectedQuantity <= 0) {
      setErrorMessages(["Please select a valid quantity"]);
      return;
    }

    // Clear any existing error messages
    setErrorMessages([]);

    const newCartItem = {
      sku_id: SKU,
      size: selectedSize,
      count: selectedQuantity,
    };

    // Add item to the cart
    axios
      .post("https://app-hrsei-api.herokuapp.com/api/fec2/rfp/cart", newCartItem, authKey)
      .then((response) => {
        setCartDataUpdated(true);

        // Update cart data
        setCartData((prevCartData) => {
          let newCartItemIndex = prevCartData.findIndex((item) => item.sku_id === newCartItem.sku_id,);
          let modalTitle = newCartItemIndex > -1 ? "Cart Updated" : "Success";
          let modalText =
            newCartItemIndex > -1
              ? `${selectedStyle.name} SKU:${SKU} quantity updated successfully`
              : `${selectedStyle.name} SKU:${SKU} Size:${selectedSize} added to the cart`;
          // Show modal with dynamic content
          setShowModalCartItem({ title: modalTitle, text: modalText });
            // Reset showModalCartItem to false after a certain duration
            setTimeout(() => {
              setShowModalCartItem(false);
            }, 4000); // Adjust the duration as needed
          if (newCartItemIndex > -1) {
            // If item already exists, update its count
            let updatedCart = [...prevCartData];
            updatedCart[newCartItemIndex].count += selectedQuantity;
            return updatedCart;
          } else {
            // If item doesn't exist, add it to the cart
            return [...prevCartData, newCartItem];
          }
        });
        console.log(
          `${selectedQuantity} of size ${selectedSize} SKU ${currentStyleId} added to the cart`,
          response.data
        );
      })
      .catch((error) => {
        // Handle errors
        console.error("Error adding item to cart:", error);
      });
  };


  // Rendering loading message if data is not available
  if (!productData || !stylesData || !reviewsData || !selectedStyle) {
    return <div>Loading...</div>;
  }

  // Props for the select option elements
  const selectOptionsProps = {
    // availableSizes,
    availableQuantities,
    handleSizeSelection,
    selectedQuantity,
    setSelectedQuantity,
    selectedSize,
    setErrorMessages,
    selectSizeRef,
    currentSKUs,
    isDropdownOpen,
  };

  // Rendering ProductOverview component
  return (
    <>
    {showModalCartItem && (
      <Modal
        size="small"
        title={showModalCartItem.title}
        text={showModalCartItem.text}
        closeAfter={3}
        autoClose={true}
        autoOpen={true}
        color="#333"
        iconCenter={<FaCheck />}
        iconSize={40}
        iconColor="#16FFFF"
      />)}
        {/* Main container for product overview module */}
      <div className="product-overview-module">
          {/* Placeholder text */}
      <span className="temp-placeholder">KFC IS COOKING! WE ARE LOADING YOUR IMAGE...</span>

          {/* Gallery Images */}
        <ImageGallery selectedStyle={selectedStyle} currentStyleId={currentStyleId} />
        {/* <ImageGalleryV1 selectedStyle={selectedStyle} currentStyleId={currentStyleId} /> */}

           {/* Product Details */}
        <div className="product-details-container">
          {/* Product Information */}
          <ProductInformation
            productData={productData}
            reviewsData={reviewsData}
            onClickReadAllReviews={onClickReadAllReviews}
            selectedStyle={selectedStyle}
          />
          {/* Social media sharing - Facebook, x, Pinterest*/}
          <div className="social-media-sharing">
          Share <span className="social-media-icons">
          <FaFacebookSquare onClick={() => handleShareClick('Facebook')} />
          <FaSquareXTwitter onClick={() => handleShareClick('Twitter')} />
          <FaPinterestSquare onClick={() => handleShareClick('Pinterest')} />
          </span></div>
          {/* Style Selector - Thumbnails for each style */}
          <Styles
            styles={stylesData.results}
            currentStyleId={currentStyleId}
            handleStyleChange={handleStyleChange}
          />
          {/* Size, Quantity Selector and error messages */}
          {errorMessages.length > 0 && <ErrorMessages messages={errorMessages} />}
          <SelectOptions {...selectOptionsProps} />
          {/* Add to Cart and like buttons */}
          <div className="add-to-cart-and-like">
            <button className="p-o-add-to-cart-button" onClick={handleAddToCart}>
              ADD TO CART
            </button>
            <button className="p-o-like-button"><FaHeart style={{fontSize:'20px'}}/></button>
          </div>
        </div>
      </div>
      {/* Product Slogan, Description and Features */}
      <SloganDescFeat productData={productData} />
    </>
  );
});

export default ProductOverview;
