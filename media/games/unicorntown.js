window.unicorn = {

	items: {

		CARROT: {
			_startswith: true,
			value: 0,
			description: "Mystical equines enjoy these carroty snacks.",
			actions: {
				EAT: function(subject) {
					unicorn.state.inventory = unicorn.state.inventory.splice(_.indexOf(unicorn.state.inventory, subject), 1);
					return "<p>A <span class='item'>" + subject + "</span> has been eaten, and holy shit was it delicious.</p>";
				},
				USE: function(subject) {
					return unicorn.items.CARROT.actions.EAT(subject);
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
				return "<p>Available commands: <span class='cmd'>" + unicorn.state.commands.join(', ') + "</span></p>";
			}
		},
		INSPECT: {
			_startswith: true,
			description: "<span class='cmd'>inspect</span> tells you more about <span class='item'>items</span> or <span class='cmd'>commands</span>. Example: <span class='cmd'>inspect</span> <span class='item'>carrot</span>. Type <span class='cmd'>help</span> for more information.",
			action: function(subject) {

				if (typeof subject === 'undefined') { subject = 'INSPECT'; }

				// var has_subject = unicorn.state.commands[subject] || unicorn.state.inventory[subject];
				var has_subject = ~_.indexOf(unicorn.state.commands, subject) || ~_.indexOf(unicorn.state.inventory, subject);

				if (!has_subject) {
					return "<p>I don't know what that is.</p>";
				}

				return "<p>" + (unicorn.items[subject] || unicorn.commands[subject]).description + "</p>";
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

				// check inventory for things...
				var has_subject = ~_.indexOf(unicorn.state.inventory, subjectName);

				if (!has_subject) {
					return "<p>You don't have one of those. You can use these things: <span class='item'>" + unicorn.state.inventory.join("</span>, </span class='item'>") + "</span></p>";
				}

				// TODO: check for requiremens here

				var subject = unicorn.items[subjectName];

				console.log("Subject", subject);

				var msg = subject.actions.USE(subjectName);

				return "<p>You use a <span class='item'>" + subjectName + "</span></p>" + msg; // need to replace this with parent prop. name
			}
		},
		PLAY: {
			_startswith: true,
			description: "<span class='cmd'>play</span> initiates a racous playtime with the unicorn. Loads of prancing. Be careful!",
			action: function() {
				// change state
				return "<p>As the unicorn bounds through a field with you, flowers are kissed with glistening sunshine radiating from its gleaming horn. It's fun.</p>";
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
				return unicorn.state._has_sellable_item;
			},
			action: function() {
				return "<p>You sell what?</p>";
			}
		},
		BEAT: {
			description: "<span class='cmd'>beat</span> allows you to savage the unicorn with your bare hands.",
			unlock: function() {
				return ( unicorn.state._tears_sold >= 3 );
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

		inventory: [],

		commands: [],

		game: {

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
		if ( typeof command === undefined ) {
			throw "CommandUndefinedError";
		}

		unicorn.utils.redrawInventory();

		command = unicorn.utils.cleanCommand(command);

		if ( command === '' ) {
			return "<p>Enter a command. Type <span class='cmd'>help</span> for a list of commands.</p>";
		}

		// parse command
		var command_tokens = command.split(' ');

		// if we don't know how to do it, we say so here.
		if ( !_.has(unicorn.commands, command_tokens[0]) ) {
			return "<p>I don\'t know how to <span class='cmd'>" + command + "</span>.</p>";
		}

		// if we DO know how to do it, let's do it!
		var message = '';

		message += unicorn.commands[command_tokens[0]].action(command_tokens[1]);

		// check for events & spit out messaging, etc.

		return message;
	},

	// defaults to '#unicorn-form', '#unicorn-messages', and '#unicorn-inventory'
	init: function() {

		// prep the inventory, etc.
		_.forEach( unicorn.items, function(obj, key) {
			if (obj._startswith) {
				unicorn.state.inventory.push(key);
			}
		});

		_.forEach( unicorn.commands, function(obj, key) {
			if (obj._startswith) {
				unicorn.state.commands.push(key);
			}
		});

		// will probably want to do some extend/replace init state with an options obj here
		// example: user feeds { cash: 100 } into init() to start with $100

		console.log('inventory: ', unicorn.state.inventory.join(', '));
		console.log('commands: ', unicorn.state.commands.join(', '));

		// greab the elements and get the form in focus
		// TODO: set up messaging if any of the required bits aren't in place (form/messages/inventory) 

		var messages = $('#unicorn-messages');

		$('#unicorn-form input[type=text]').trigger("focus");
		$('#unicorn-form').on("submit", function(event) {

			var command = $(this).find('input[type=text]').val();

			event.preventDefault();

			messages.find('p').addClass('faded');

			$(this).find('input[type=text]').val('');

			messages.prepend(unicorn.tick(command));
		});

		// push out welcome message
		messages.prepend("<p>Welcome to Unicorn Town! A text-based adventure that will make you wise beyond your years. Try typing <span class='cmd'>help</span> for a list of commands.</p><p>You have a <span class='item'>carrot</span></p>");
		unicorn.utils.redrawInventory();
	},

	utils: {
		redrawInventory: function() {
			var inventory = $('#unicorn-inventory');
			inventory.html('<p>inventory:</p>');
			_.forEach(unicorn.state.inventory, function(value, index) {
				inventory.append("<div class='item'><img src='/media/img/" + value + ".png' alt='" + value + "'></div>");
			});
		},
		cleanCommand: function(command) {
			if (typeof command !== 'string') {
				return '';
			}
			// Trim leading and trailing white space
			command = command.replace(/^\s+|\s+$/g, '');
			command = _.escape(command);
			command = command.toUpperCase();

			return command;
		}
	}

};
