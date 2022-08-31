import alfy from 'alfy';
import { Strava } from 'strava';
import moment from "moment";

const METERS_TO_MILES = 0.0006213712;

const formatTime = (date) => {
  const dateString = moment(date).format("dddd, MMMM DD, YYYY");
  const timeString = moment(date).format("H:mmA");
  return `${timeString} on ${dateString}`;
}

const formatDistance = (distance) => {
  if (process.env.METRIC_UNITS) {
    return `${(distance / 1000).toFixed(1)} km`;
  }

  return `${(distance * METERS_TO_MILES).toFixed(1)} mi`;
}

const strava = new Strava({
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  refresh_token: process.env.REFRESH_TOKEN,
})

const activities = await strava.activities.getLoggedInAthleteActivities()

const items = alfy
	.inputMatches(activities, 'name')
	.map(activity => {
    return {
      title: activity.name,
      subtitle: `${formatDistance(activity.distance)} (${formatTime(activity.start_date)})`,
      arg: activity.id
    }
  });

alfy.output(items);
