import { Link, useLocation, type LinkProps } from 'react-router'

/** A Link that keeps the current query string, so filters and viewport survive navigation. */
export function SearchLink({ to, ...rest }: Omit<LinkProps, 'to'> & { to: string }) {
  const { search } = useLocation()
  return <Link to={{ pathname: to, search }} {...rest} />
}
