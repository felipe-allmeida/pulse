import { useTranslation } from 'react-i18next';
import { RankedPlaces } from '@/components/ranked-places';
import { useStats } from '@/lib/api';

/**
 * The two all-time reach rankings, side by side: busiest countries and busiest
 * cities, each labelled with how many distinct places it is the top slice of.
 *
 * Deliberately all-time, unlike everything else on `/live`. The map, the recent
 * visits table and the event feed all describe the last hours of traffic; this
 * is the one place that answers "how far has this thing travelled since it went
 * up", which is the question a ranking is actually good at.
 */
export function ReachRow() {
  const { t } = useTranslation('dashboard');
  const { data, isLoading } = useStats();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <RankedPlaces
        title={t('dashboard:reach.countriesTitle')}
        total={data?.countries}
        totalLabel={t('dashboard:reach.countryCount', { count: data?.countries ?? 0 })}
        places={data?.topCountries}
        isLoading={isLoading}
        format={(place) => place.country}
      />
      <RankedPlaces
        title={t('dashboard:reach.citiesTitle')}
        total={data?.cities}
        totalLabel={t('dashboard:reach.cityCount', { count: data?.cities ?? 0 })}
        places={data?.topCities}
        isLoading={isLoading}
        format={(place) => `${place.city}, ${place.country}`}
      />
    </div>
  );
}
