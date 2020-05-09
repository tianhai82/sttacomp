import wretch from "wretch";

export function calculateDraws({ winners, runnerups }) {
  return wretch(`/api/draw/winners/${winners}/runnerups/${runnerups}`)
    .get()
    .json()
}