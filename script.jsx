const React = window.React;
const ReactDOM = window.ReactDOM;
const _ = window._;

const scryfallSearchBaseUrl = "https://api.scryfall.com/cards/search?q=";

// TODO: fix bug where card equality is done object-wise instead of id-wise

class AppRoot extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cardsPool: [],
      searchQuery: "set:iko",
      lockedCards: [],
      randomPicks: [],
      deckSize: 9
    };
  }

  receiveCards(cards) {
    this.setState({ cardsPool: cards });
    console.debug(cards);
  }

  onSearchQueryChange(searchQuery) {
    this.setState({ searchQuery: searchQuery });
  }

  cardIsLocked(card) {
    return _.includes(this.state.lockedCards, card);
  }

  toggleLockCard(card) {
    if (this.cardIsLocked(card)) {
      // unlock it
      this.setState({
        lockedCards: _.without(this.state.lockedCards, card),
        randomPicks: _.concat(this.state.randomPicks, card)
      });
    } else {
      // lock it
      this.setState({
        lockedCards: _.concat(this.state.lockedCards, card),
        randomPicks: _.without(this.state.randomPicks, card)
      });
    }
  }

  shuffleUnlocked() {
    this.setState({
      randomPicks: _.sampleSize(
        _.without(this.state.cardsPool, ...this.state.lockedCards),
        this.state.deckSize - this.state.lockedCards.length
      )
    });
  }
  
  handleDeckSizeChange(event) {
    this.setState({
      deckSize: event.target.value
    })
  }

  render() {
    const deck = _.concat(this.state.lockedCards, this.state.randomPicks);

    const deckView = deck.map((card, index) => (
      <CardView
        card={card}
        key={index}
        lockCardHandler={this.toggleLockCard.bind(this)}
        isLocked={this.cardIsLocked(card)}
      />
    ));

    return (
      <div>
        <h1>Hello!</h1>
        
        <p className="help">
          Enter a <a href="https://scryfall.com/docs/syntax">Scryfall query</a> and hit "Load cards!".<br/> If your query is too broad, this'll take a long time.
          After it's done loading, hit "Shuffle!" to deal some cards.<br/>
          Click on the cards to lock them, adjust the query and load and shuffle for more cards until you have a solid base for a deck.<br/>
          The idea of 9 cards per deck comes from a <a href="https://www.youtube.com/watch?v=ScJ1IigNlFY">beginner's guide on MtG deckbuilding</a>.
        </p>

        <p>There are {this.state.cardsPool.length} cards in the pool.</p>

        <div>
          <QueryInput
            query={this.state.searchQuery}
            onChangeHandler={this.onSearchQueryChange.bind(this)}
          />

          <LoadCardsButton
            searchQuery={this.state.searchQuery}
            cardsArray={this.props.cardsPool}
            loadedCardsHandler={this.receiveCards.bind(this)}
          />
        </div>

        <div>
          <input type="number" value={this.state.deckSize} onChange={this.handleDeckSizeChange.bind(this)} />
          <button onClick={this.shuffleUnlocked.bind(this)}>Shuffle!</button>
        </div>

        <div className="deck">{deckView}</div>
      </div>
    );
  }
}

class LoadCardsButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buttonText: "Load cards!",
      enabled: true
    };
  }

  loadCards(url, toArray) {
    return fetch(url)
      .then(response => response.json())
      .then(response => {
        if (response.object == "list") {
          response.data.forEach(card => toArray.push(card));

          if (response.has_more) {
            return this.loadCards(response.next_page, toArray);
          }
        } else {
          console.error("Something went wrong with the fetch");
          console.debug(response);
        }
      });
  }

  handleClick() {
    this.setState({
      enabled: false,
      buttonText: "Loading..."
    });

    const loadedCards = [];
    const url = scryfallSearchBaseUrl + this.props.searchQuery;

    this.loadCards(url, loadedCards).then(() => {
      this.props.loadedCardsHandler(loadedCards);

      this.setState({
        enabled: true,
        buttonText: "Load cards!"
      });
    });
  }

  render() {
    return (
      <button
        onClick={this.handleClick.bind(this)}
        disabled={!this.state.enabled}
      >
        {this.state.buttonText}
      </button>
    );
  }
}

class QueryInput extends React.Component {
  constructor(props) {
    super(props);
  }

  handleChange(event) {
    this.props.onChangeHandler(event.target.value);
  }

  render() {
    return (
      <input
        type="text"
        defaultValue={this.props.query}
        onChange={this.handleChange.bind(this)}
      />
    );
  }
}

class CardView extends React.Component {
  handleClick(event) {
    this.props.lockCardHandler(this.props.card);
  }

  render() {
    const card = this.props.card;
    const className = this.props.isLocked ? "card locked" : "card";

    // TODO: change image from small to normal (also CSS)
    return (
      <div onClick={this.handleClick.bind(this)} className={className}>
        <img src={card.image_uris.normal} />
      </div>
    );
  }
}

ReactDOM.render(<AppRoot cardsPool={[]} />, document.getElementById("root"));
