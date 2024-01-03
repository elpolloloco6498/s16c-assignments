export default {
    name: "Add One",
    description: "This action adds one",
    key: "add_one",
    version: "0.0.2",
    type: "action",
    props: {
        num: {
            type: "integer",
            label: "Number"
        }
    },
    async run({ $ }) {
        $.export("$summary", `Result is ${this.num+1}`)
        return this.num+1;
    },
  };