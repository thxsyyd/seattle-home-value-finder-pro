import { PageShell } from '../components/PageShell'
import { useIndex } from '../data/useIndex'
import { money, priceShort, signedPct } from '../lib/format'

const LEGACY = `${import.meta.env.BASE_URL}legacy/Seattle_Home_Value_Dashboard_v4.html`

export function About() {
  const { data: ix } = useIndex()
  const m = ix?.model
  const rows: [string, string][] = m
    ? [
        ['Linear regression, 6 features (the course model)', 'linear_course_features'],
        ['Random forest, same 6 features', 'random_forest_course_features'],
        ['Gradient boosting, 17 features', 'hgb_17_features_log'],
        ['Gradient boosting, 17 features + nearby comparable sales (used here)', 'hgb_17_features_log_neighbors'],
      ]
    : []

  return (
    <PageShell title="About this project">
      <p>
        Seattle Home Value Finder is a course project for INFO 5002 (Introduction to Python), Northeastern University, by Daisy Tang.
        It asks where in King County, Washington a first-time buyer on a budget would have found homes that sold for less than a model says
        similar homes were worth, and shows the answer on a map you can filter and share.
      </p>

      <section>
        <h2>What the data is, and is not</h2>
        <ul>
          <li>{ix ? ix.nHomes.toLocaleString() : '21,613'} home sales in King County, {ix ? `${ix.dataRange[0]} to ${ix.dataRange[1]}` : '2014–2015'}. All prices are what the homes <em>sold for then</em>. These are not current listings and nothing here is for sale.</li>
          <li>The data (the public “House Sales in King County, USA” set on Kaggle) has no street addresses, photos, schools, commute or crime information, so a home appears only as a point on the map.</li>
          <li>“Today’s dollars” uses the S&amp;P Case-Shiller Seattle index (via FRED) or the FHFA ZIP-level index. These are market averages and do not value any individual home.</li>
        </ul>
      </section>

      <section>
        <h2>The model estimate</h2>
        <p>
          Each home’s “model estimate” comes from gradient boosting on the sale’s features (size, grade, location, age and so on), plus the typical price per square foot
          of the 20 nearest other sales. Estimates are <strong>out-of-fold</strong>: the model that estimates a home never saw that home or any other sale of the same house.
        </p>
        {m && (
          <table>
            <thead><tr><th scope="col">Model</th><th scope="col" className="num">R²</th><th scope="col" className="num">Typical error</th></tr></thead>
            <tbody>
              {rows.map(([label, key]) => (
                <tr key={key}><td>{label}</td><td className="num">{m.models[key].r2.toFixed(3)}</td><td className="num">{money(m.models[key].mae)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="hint">{m && `5-fold cross-validation grouped by house. “Typical error” is the mean absolute error. For 80% of sales the price falls between ${signedPct(m.error_overall.p10)} and ${signedPct(m.error_overall.p90)} of the estimate.`}</p>
        <h3>Why this differs from the course report</h3>
        <p>
          The graded report used a linear regression on six features and one 80/20 split (test R² 0.647). That report is unchanged and remains the record for the course;
          <a href={LEGACY}> the original course dashboard is still available</a>. This version replaces the model because a straight line misjudges parts of the market:
        </p>
        {m && (
          <table>
            <thead><tr><th scope="col">Sold price</th><th scope="col" className="num">Sales</th><th scope="col" className="num">Linear model: median error</th><th scope="col" className="num">This version</th></tr></thead>
            <tbody>
              {m.bias_by_price.map((b) => (
                <tr key={b.price_lo}>
                  <td>{b.price_lo === 0 ? `under ${priceShort(b.price_hi)}` : b.price_hi > 1e8 ? `${priceShort(b.price_lo)} and up` : `${priceShort(b.price_lo)}–${priceShort(b.price_hi)}`}</td>
                  <td className="num">{b.n.toLocaleString()}</td>
                  <td className="num">{signedPct(b.linear_median_error, 1)}</td>
                  <td className="num">{signedPct(b.v2_median_error, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p>
          A positive error means the model guessed too high. In the $300k–$500k range the linear model guessed high by a large margin, which can make sales there look “under-valued” without being cheaper than comparable homes.
          {m && ` The two models’ top-200 “most below estimate” lists share only ${m.top200_overlap} sales.`}
        </p>
        <h3>“Below the model” is not “a deal”</h3>
        <ul>
          <li>The model cannot see condition, finishes, lot problems or who the buyer and seller were. A gap smaller than its usual error is mostly noise.</li>
          <li>Very large gaps (more than 40% below) can reflect unusual transactions, for example a sale between relatives, or errors in the data, so they are flagged and sorted last.</li>
          <li>Picking the biggest gaps out of thousands of sales naturally selects for the model’s mistakes.</li>
        </ul>
      </section>

      <section>
        <h2>Reading the map</h2>
        <ul>
          <li>Zoomed out, colour shows the median price per square foot in smoothed hexagonal areas. Areas with few sales are pulled toward the surrounding area’s value, and areas with fewer than {ix?.hex.minN ?? 3} sales are grey. The colours always reflect all sales, not the filters.</li>
          <li>ZIP-code view uses Census ZIP Code Tabulation Areas, which approximate but are not identical to postal ZIP codes.</li>
          <li>Zoomed in, each dot is one sale; the label shows its sold price, with ▼ or ▲ when it is clearly below or above the model estimate.</li>
        </ul>
      </section>

      <section>
        <h2>Credits</h2>
        <ul>
          <li>Base map: © OpenStreetMap contributors, OpenMapTiles, served by OpenFreeMap; rendering by MapLibre GL JS.</li>
          <li>Price indexes: S&amp;P Dow Jones Indices (Case-Shiller) and Freddie Mac mortgage rates, via FRED, Federal Reserve Bank of St. Louis; FHFA House Price Index.</li>
          <li>ZIP boundaries: U.S. Census Bureau. Colour scales: ColorBrewer (Cynthia Brewer).</li>
          <li>Home sales: Kaggle “House Sales in King County, USA”.</li>
        </ul>
        <p>This is an educational project, not financial or investment advice.</p>
      </section>
    </PageShell>
  )
}
