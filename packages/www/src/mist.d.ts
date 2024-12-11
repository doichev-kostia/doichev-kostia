type ReactHTMLProps<
  Tag extends keyof React.ReactHTML
> = React.ReactHTML[Tag] extends React.DetailedHTMLFactory<infer Attributes, infer Element>
  ? React.DetailedHTMLProps<Attributes, Element>
  : React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>

interface Mist_button extends ReactHTMLProps<'button'> {
}

interface Mist_a extends ReactHTMLProps<'a'> {
  'data-component'?: never
}

interface Mist_a_data_component_button extends ReactHTMLProps<'a'> {
  'data-component': 'button'
  'data-variant'?: 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  'data-size'?: 'sm' | 'lg' | 'icon'
  'data-variant'?: boolean
  'data-size'?: boolean
}

declare namespace JSX {
  interface IntrinsicElements {
    button: Mist_button
    a: Mist_a | Mist_a_data_component_button
  }
}
