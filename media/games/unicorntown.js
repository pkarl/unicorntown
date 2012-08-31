window.game = {

	items: {

		CARROT: {
			_startswith: true,
			value: 0,
			description: "Mystical equines enjoy these carroty snacks. Type <span class='cmd'>use</span> <span class='item'>carrot</span> to see what it does.",
			actions: {
				EAT: function(subject) {
					game.state.inventory.remove(subject);
					return "<p>A <span class='item'>" + subject + "</span> has been eaten, and holy shit was it delicious.</p>";
				},
				USE: function(subject) {
					return game.items.CARROT.actions.EAT(subject);
				}
			}
		},

		TEAR: {
			value: 100,
			description: "The tears of a unicorn. Some say they have healing powers.",
			actions: {
				HEAL: function(subject) {
					// is the unicorn hurt?
					// heal the unicorn
				},
				USE: function(subject) {
					return game.items.TEAR.actions.HEAL(subject);
				},
				SELL: function() {
					game.inventory.remove('TEAR');
					game.inventory.pay(game.items.TEAR.value);
				}
			}
		},

		SUGARCUBE: {
			value: 1,
			description: "Mystical equines enjoy these sugary snacks."
		},

		BRUSH: {
			value: 5,
			description: "Horses enjoy getting groomed. Why not unicorn?"
		}

	}, 

	commands: {

		HELP: {
			_startswith: true,
			description: "<span class='cmd'>help</span> shows a list of available commands",
			action: function() {
				return "<p>Available commands: <span class='cmd'>" + game.state.commands.join(', ') + "</span></p>";
			}
		},
		INSPECT: {
			_startswith: true,
			description: "<span class='cmd'>inspect</span> tells you more about <span class='item'>items</span> or <span class='cmd'>commands</span>. Example: <span class='cmd'>inspect</span> <span class='item'>carrot</span>. Type <span class='cmd'>help</span> for more information.",
			action: function(subject) {

				if (typeof subject === 'undefined') { subject = 'INSPECT'; }

				if ( (!game.state.inventory.has(subject)) && ~_.indexOf(game.commands, subject) ) {
					return "<p>I don't know what that is.</p>";
				}

				return "<p>" + (game.items[subject] || game.commands[subject]).description + "</p>";
			}
		},
		USE: {
			_startswith: true,
			description: "<span class='cmd'>use</span> attempts to do something with a <span class='item'>thing</span>. Example: <span class='cmd'>use brush</span>",
			requires: function() {
				// test for various state requirements, return true or false
			},
			action: function(subjectName) {
				if (typeof subjectName === 'undefined') {
					return "<p>What do you want to use?</p>";
				}

				if (!game.state.inventory.has(subjectName)) {
					return "<p>You don't have one of those." + (game.state.inventory.items().length ? " You can use these things: <span class='item'>" + game.state.inventory.items().join("</span>, </span class='item'>") + "</span>" : "") + "</p>";
				}

				// TODO: check for requirements here

				var subject = game.items[subjectName];
				var msg = subject.actions.USE(subjectName);

				return "<p>You use a <span class='item'>" + subjectName + "</span></p>" + msg; // need to replace this with parent prop. name
			}
		},
		PLAY: {
			_startswith: true,
			description: "<span class='cmd'>play</span> initiates a racous playtime with the unicorn. Loads of prancing. Be careful!",
			action: function() {
				var add_tears = false;
				// change state
				game.state.game._unicorn_play_count += 1;

				// is play_count 3
				if (game.state.game._unicorn_play_count > 3) {
					if (Math.random() < 4/11) {
						add_tears = true;
					}
				} else if (game.state.game._unicorn_play_count === 3) {
					add_tears = true;
				}

				if (add_tears) {
					game.state.inventory.add("TEAR");
					return "<p>Oh no! While you were playing the unicorn fell and hurt itself!</p><p>You have gained a unicorn <span class='item'>TEAR</span>";	
				}

				return "<p>As the unicorn bounds through a field with you, flowers are kissed with glistening sunshine radiating from its gleaming horn. You have made the unicorn happy.</p>";
			}
		},
		QUIT: {
			_startswith: true,
			description: "<span class='cmd'>quit</span> is pretty self-explanatory",
			action: function() {
				return "<p>You quit.</p>";
			}
		},
		SELL: {
			description: "<span class='cmd'>sell</span> allows you to exchange some <span class='item'>items</span> for money.",
			unlock: function() {
				return game.state._has_sellable_item;
			},
			action: function() {
				return "<p>You sell what?</p>";
			}
		},
		BEAT: {
			description: "<span class='cmd'>beat</span> allows you to savage the unicorn with your bare hands.",
			unlock: function() {
				return ( game.state._tears_sold >= 3 );
			},
			action: function() {
				return "<p>You mistreat the unicorn.</p>";
			}
		}

	},

	state: {

		player: {
			cash: 0
		},

		inventory: {

			_items: [],
			_cash: 0,

			init: function() {
				var inventory = game.state.inventory;

				// prep the inventory, etc.
				_.forEach( game.items, function(obj, key) {
					if (obj._startswith) {
						inventory.add(key);
					}
				});

				return inventory;
			},

			reset: function() {
				var inventory = game.state.inventory;
				inventory._items = [];
				return;
			},

			add: function(item) { // TODO: finish property vs. lookup convo with MP
				return game.state.inventory._items.push(item);	
			},

			pay: function(amount) {
				game.state.inventory._cash += amount;
			},

			getCash: function() {
				return game.state.inventory._cash;
			},

			// TODO: check for presence of item before attempting to remove it
			remove: function(item) {
				var inventory = game.state.inventory;
				
				return inventory._items.splice(_.indexOf(inventory._items, item), 1);
			},

			has: function(item) {
				// checks to see if item is in inventory, returns truthy/falsey
				return ~_.indexOf(game.state.inventory.items(), item);
			},

			items: function() {
				return game.state.inventory._items;
			}
		},

		commands: [],

		commandHistory: {
			// Latest unsubmitted command
			_next: "",
			_commands: [],
			_position: 0,
			reset: function() {
				var history = game.state.commandHistory;
				history._position = history._commands.length = 0;
				history._next = "";
			},
			setNext: function(next) {
				game.state.commandHistory._next = next;
			},
			push: function(command) {
				var history = game.state.commandHistory;
				history._commands.unshift(command);
				history._next = "";
			},
			moveTo: function(newPosition) {
				var history = game.state.commandHistory;
				var length = history._commands.length;

				if (newPosition >= length) {
					history._position = length - 1;
				} else if (newPosition < -1) {
					history._position = -1;
				} else {
					history._position = newPosition;
				}

				if (history._position === -1) {
					return history._next;
				} else {
					return history._commands[history._position];
				}
			},
			moveBy: function(offset) {
				var history = game.state.commandHistory;
				return history.moveTo(history._position + offset);
			}
		},

		game: {

			_unicorn_play_count: 0, // have you played with the unicorn yet?
			_has_sellable_item: false,
			_tears_count: 0,	// # of tears drawn from unicorn
			_hairs_count: 0,	// # of hairs plucked from unicorn

			commerce: {
				// number of items sold?
			}
		}

	}, 

	tick: function(command) {

		// if no command was given, maybe we should just return false
		if ( typeof command === 'undefined' ) {
			throw "CommandUndefinedError";
		}

		game.state.commandHistory.moveTo(-1);
		game.state.commandHistory.push(command);

		command = game.utils.cleanCommand(command);

		if ( command === '' ) {
			return "<p>Enter a command. Type <span class='cmd'>help</span> for a list of commands.</p>";
		}

		// parse command
		var command_tokens = command.split(' ');

		// if we don't know how to do it, we say so here.
		if ( !~_.indexOf(game.state.commands, command_tokens[0]) ) {
			return "<p>I don\'t know how to <span class='cmd'>" + command + "</span>.</p>";
		}

		// if we DO know how to do it, let's do it!
		var message = '';

		message += game.commands[command_tokens[0]].action(command_tokens[1]);

		// check for events & spit out messaging, etc.

		game.utils.redrawInventory();

		return message;
	},

	// defaults to '#unicorn-form', '#unicorn-messages', and '#unicorn-inventory'
	init: function() {

		game.state.inventory.init();

		_.forEach( game.commands, function(obj, key) {
			if (obj._startswith) {
				game.state.commands.push(key);
			}
		});

		// will probably want to do some extend/replace init state with an options obj here
		// example: user feeds { cash: 100 } into init() to start with $100

		var messages = $('#unicorn-messages');

		$('#unicorn-form input[type=text]').trigger("focus")
			// Randomize input name to prevent suggestions in modern browsers
			.attr("name", "unicorn-command" + Math.random());
		$('#unicorn-form').on("submit", function(event) {

			var command = $(this).find('input[type=text]').val();

			event.preventDefault();

			messages.find('p').addClass('faded');

			$(this).find('input[type=text]').val('');

			messages.prepend(game.tick(command));
		}).on("keydown", "input[type=text]", function(event) {
			var arrowUp = 38;
			var arrowDown = 40;
			var commandHistory = game.state.commandHistory;
			var $target = $(event.target);
			var recalledCommand;

			if (event.which === arrowUp || event.which === arrowDown) {

				if (event.which === arrowUp) {
					recalledCommand = commandHistory.moveBy(1);
				} else if (event.which === arrowDown) {
					recalledCommand = commandHistory.moveBy(-1);
				}

				$target.val(recalledCommand).trigger("focus");

				// Set the cursor position to the end of the field
				$target
					// First, unbind any previously-bound handlers in order to prevent
					// queuing of functionally identical handlers. This is important when
					// an arrow key is held down, issuing multiple "keydown" events
					// without corresponding "keyup" events.
					.off("keyup.moveCursor")
					.on("keyup.moveCursor", function(event) {
						if (event.target.setSelectionRange) {
							event.target.setSelectionRange(event.target.value.length, event.target.value.length);
						}
					});
			} else {
				commandHistory.setNext($target.val() + String.fromCharCode(event.which));
			}
		});

		messages.prepend("<p>Welcome to Unicorn Town: A text-based adventure!</p><p>Type <span class='cmd'>help</span> for a list of commands.</p><p>Why don't you try playing with your unicorn by typing <span class='cmd'>play</span>?</p>");
		game.utils.redrawInventory();
	},

	utils: {
		redrawInventory: function() {
			var itemList = $('#unicorn-inventory .items');
			var formattedCash = game.state.inventory.getCash().toFixed(2);

			itemList.empty();
			_.forEach(game.state.inventory.items(), function(value, index) {
				itemList.append("<li class='item'>" + value + "</li>");
			});

			$("#unicorn-inventory .cash .amount")
				.text(formattedCash);
		},
		cleanCommand: function(command) {
			if (typeof command !== 'string') {
				return '';
			}
			// Trim leading and trailing white space
			command = command.replace(/^\s+|\s+$/g, '');
			command = _.escape(command);
			command = command.toUpperCase(); // this is thx to our key names being in UC

			return command;
		},
		tmpl: {
			item: function(itemName) {
				return "<span class='item'>" + itemName + "</span>";
			},
			command: function(cmdName) {
				return "<span class='cmd'>" + cmdName + "</span>";
			}
		}
	}

};
