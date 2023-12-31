import { FormEvent, useContext, useEffect, useRef, useState } from "react";
import "./AddTrial.css";
import Trial from "../models/Trial";
import { useNavigate, useParams } from "react-router-dom";
import { addTrial } from "../services/trialApiService";
import PatientContext from "../context/PatientContext";
import AuthContext from "../context/AuthContext";
import { storage } from "../firebaseConfig";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFood, getNutritionFacts } from "../services/foodApiService";
import FoodResponse from "../models/FoodResponse";
import FoodIngredientResponse from "../models/FoodIngredientResponse";
// import SearchBar from "./SearchBar";

const AddTrial = () => {
  const navigate = useNavigate();
  const [trial, setTrial] = useState("");
  const [typeOfTrial, setTrialType] = useState("Give A Food");
  const [foodType, setFoodType] = useState("purchased");
  const [trialFood, setTrialFood] = useState("");
  // const [foodPhoto, setFoodPhoto] = useState("");
  const [startDate, setStartDate] = useState("");
  // const [trialStatus, setTrialStatus] = useState("In Process");
  const [reaction, setReaction] = useState([]);
  const [foodSearchResults, setFoodSearchResults] = useState<FoodResponse>();
  const { patients } = useContext(PatientContext);
  const patientId: string = useParams().patientId!;
  const { user } = useContext(AuthContext);
  const fileUploadRef = useRef<HTMLInputElement>(null);

  const [nutritionDetails, setNutritionDetails] =
    useState<FoodIngredientResponse>();

  let nixID: string | undefined = "";

  // //console.log(trialFood);
  useEffect(() => {
    if (foodSearchResults?.branded[0].nix_item_id) {
      nixID = foodSearchResults?.branded[0].nix_item_id;

      getNutritionFacts(nixID!).then((facts) => {
        setNutritionDetails(facts);
      });
    }
  }, [foodSearchResults]);

  // console.log(nutritionDetails);
  // console.log(nutritionDetails?.foods[0].nf_ingredient_statement);

  const submitHandler = async (e: FormEvent): Promise<void> => {
    //console.log("test");
    e.preventDefault();
    console.log(new Date(new Date(startDate).getTime()));
    const someFiles = fileUploadRef.current?.files;

    const newTrial: Trial = {
      guardianID: user!.uid.toString(),
      patient_id: patientId,
      trial_name: trial,
      trial_type: typeOfTrial,
      food_type: foodType,
      trial_food: trialFood,
      //food_photo_url: "",
      start_date: new Date(new Date(startDate).getTime() - 14400000),
      trial_pass: "In Process",
      nutrition_info: nutritionDetails?.foods[0].nf_ingredient_statement,
    };

    if (someFiles && someFiles[0]) {
      // console.log(someFiles[0]); //
      const newFile = someFiles[0];
      const storageRef = ref(storage, newTrial.start_date + newFile.name);
      //uploadBytes is async
      uploadBytes(storageRef, newFile).then((snapshot) => {
        getDownloadURL(snapshot.ref).then((url) => {
          //console.log(url);
          newTrial.food_photo_url = url;
          //console.log(newTrial.food_photo_url);
          //when the promise is returned, get download URL
          //getDownloadURL(snapshot.ref).then((url) => console.log(url));
          addTrial(newTrial).then(() => {
            navigate("/Home");
          });
        });
      });
    } else {
      addTrial(newTrial).then(() => {
        navigate("/Home");
      });
    }
  };

  const nutritionFacts = (): void => {
    //call the nutritionFact api with nixID

    if (trialFood.length > 0) {
      getFood(trialFood).then((response) => {
        setFoodSearchResults(response);
        console.log(response);
      });
    }
  };

  return (
    <div className="trialPage">
      <form className="AddTrialForm" onSubmit={submitHandler}>
        <h1>Add A New Trial:</h1>
        <label htmlFor="trial">Trial:</label>
        <input
          required
          type="text"
          name="trial"
          id="trial"
          onChange={(e) => setTrial(e.target.value)}
          value={trial}
        />
        <p>
          <label htmlFor="startDate">Start Date and Time:</label>
          <input
            required
            type="datetime-local"
            name="startDate"
            id="startDate"
            onChange={(e) => setStartDate(e.target.value)}
            value={startDate}
          />
        </p>
        <p>
          <label htmlFor="typeOfTrial">Type Of Trial:</label>
          <select
            name="typeOfTrial"
            id="typeOfTrial"
            value={typeOfTrial}
            onChange={(e) => setTrialType(e.target.value)}
          >
            <option value="giveFood">Give A Food</option>
            <option value="takeAwayFood">Take Away A Food</option>
          </select>
        </p>
        <label htmlFor="foodType">Food Type:</label>
        <select
          name="foodType"
          id="foodType"
          value={foodType}
          onChange={(e) => setFoodType(e.target.value)}
        >
          <option value="purchased">Purchased</option>
          <option value="homeMade">Home Made</option>
        </select>
        <p>
          <label htmlFor="trialFood">Trial Food:</label>
          <input
            required
            type="text"
            name="trialFood"
            id="trialFood"
            onChange={(e) => setTrialFood(e.target.value)}
            value={trialFood}
          />
          <button
            type="button"
            className="showNutrition"
            onClick={() => {
              nutritionFacts();
            }}
          >
            Select Food
          </button>
          {nutritionDetails && (
            <div className="showIngredients">
              <h3>Ingredients are subject to change!</h3>
              Ingredients List:{" "}
              {nutritionDetails?.foods[0].nf_ingredient_statement}
              <p></p>
            </div>
          )}
          {/* <SearchBar
            placeholder="Enter Food..."
            data={foodSearchResults[1].branded}
          /> */}
          {/* <select
            name="trialFood"
            id="trialFood"
            value={trialFood}
            onChange={(e) => setTrialFood(e.target.value)}
          >
            <option value="trialFood">API</option>
          </select> */}
        </p>
        <label htmlFor="photo">Upload a photo:</label>
        <input type="file" name="photo" id="photo" ref={fileUploadRef} />
        <p className="photoDesc">
          Manufacturers can change ingredients at any time! Take a picture of
          the package, so you can be sure of the ingredients at time of trial!
        </p>
        <p>
          <button className="trialSaveBtn">Save</button>
        </p>
      </form>
      <button
        className="finished"
        onClick={() => {
          navigate("/");
        }}
      >
        Back to Home
      </button>
    </div>
  );
};

export default AddTrial;
