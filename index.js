import alfy from "alfy";
import { Strava } from "strava";
import fs from "fs";
import fetch from "node-fetch";
import moment from "moment";

const METERS_TO_MILES = 0.0006213712;
const TOKEN_PATH = "./token.json";

const formatTime = (date) => {
  const dateString = moment(date).format("dddd, MMMM DD, YYYY");
  const timeString = moment(date).format("H:mmA");
  return `${timeString} on ${dateString}`;
};

const formatDistance = (distance) => {
  if (process.env.METRIC_UNITS) {
    return `${(distance / 1000).toFixed(1)} km`;
  }

  return `${(distance * METERS_TO_MILES).toFixed(1)} mi`;
};

const getRefreshToken = async () => {
  const url = `https://www.strava.com/oauth/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${process.env.CODE}&grant_type=authorization_code`;
  const response = await fetch(url, {
    method: "POST",
  });
  return response.json();
};

const loadRefreshToken = async () => {
  let token;
  try {
    const data = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    token = data.refresh_token;
  } catch (e) {
    const data = await getRefreshToken();
    fs.writeFileSync(
      TOKEN_PATH,
      JSON.stringify({ refresh_token: data.refresh_token })
    );
  }

  return token;
};

const refreshToken = await loadRefreshToken();

let output;

if (!!refreshToken) {
  const strava = new Strava({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  const activities = await strava.activities.getLoggedInAthleteActivities();

  output = alfy.inputMatches(activities, "name").map((activity) => {
    return {
      title: activity.name,
      subtitle: `${formatDistance(activity.distance)} (${formatTime(
        activity.start_date
      )})`,
      arg: activity.id,
    };
  });
} else {
  output = [
    {
      title: "Please check your workflow configuration!",
      subtitle: "Confirm your values for CLIENT_ID, CLIENT_SECRET, and CODE.",
    },
  ];
}

alfy.output(output);
